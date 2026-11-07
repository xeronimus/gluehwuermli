<#
.SYNOPSIS
  Sends DMX through an Enttec DMX USB Pro to a range of channels, without any other software.

.EXAMPLE
  ./scripts/dmxRangeTest.ps1 -Port COM4 -From 20 -To 37
  all channels 20-37 at 255 for 10 s

.EXAMPLE
  ./scripts/dmxRangeTest.ps1 -Port COM4 -From 20 -To 37 -Exclude 29,30 -Value 128 -Seconds 30
  without the BeamZ lasers, at half

.EXAMPLE
  ./scripts/dmxRangeTest.ps1 -Port COM4 -From 10 -To 15 -Chase -StepSeconds 2
  one channel after the other, to find out what each does

.EXAMPLE
  ./scripts/dmxRangeTest.ps1 -Port COM4 -From 1 -To 512 -Alternate -StepSeconds 3 -Seconds 60
  all channels switch between 255 and 0 every 3 s: with a working output a DC voltmeter between XLR pins 2 and 3
  jumps (about +3 V at 255, negative at 0); a reading that stays still means no data leaves the widget

.NOTES
  Close Gluehwuermli / EMU first: only one program can open the port. All channels go to 0 at the end, also on Ctrl+C.
#>
param(
  [Parameter(Mandatory)][string]$Port,
  [Parameter(Mandatory)][ValidateRange(1, 512)][int]$From,
  [Parameter(Mandatory)][ValidateRange(1, 512)][int]$To,
  [ValidateRange(0, 255)][int]$Value = 255,
  [int[]]$Exclude = @(),
  [int]$Seconds = 10,
  [switch]$Chase,
  [switch]$Alternate,
  [double]$StepSeconds = 2
)

if ($To -lt $From) { throw "-To ($To) must not be below -From ($From)" }
if ($Chase -and $Alternate) { throw '-Chase and -Alternate exclude each other' }
if ($Alternate -and $Value -eq 0) { throw '-Alternate switches between -Value and 0, so -Value must not be 0' }

function New-DmxPacket([byte[]]$universe) {
  $length = $universe.Length + 1   # + start code
  $packet = New-Object byte[] (4 + $length + 1)
  $packet[0] = 0x7E                # start of message
  $packet[1] = 0x06                # label 6: send DMX
  $packet[2] = $length -band 0xFF
  $packet[3] = ($length -shr 8) -band 0xFF
  $packet[4] = 0x00                # DMX start code
  [Array]::Copy($universe, 0, $packet, 5, $universe.Length)
  $packet[$packet.Length - 1] = 0xE7 # end of message
  return , $packet
}

# the widget's reply to a request, or $null if it doesn't answer with that label and at least 4 data bytes
function Request-Reply($sp, [byte[]]$request, [byte]$label) {
  $sp.DiscardInBuffer()
  $sp.Write($request, 0, $request.Length)
  Start-Sleep -Milliseconds 300
  $count = $sp.BytesToRead
  if ($count -lt 9) { return $null }
  $reply = New-Object byte[] $count
  [void]$sp.Read($reply, 0, $count)
  if ($reply[0] -ne 0x7E -or $reply[1] -ne $label) { return $null }
  return , $reply
}

function Send-ForSeconds($sp, [byte[]]$universe, [double]$duration) {
  $packet = New-DmxPacket $universe
  $end = (Get-Date).AddSeconds($duration)
  while ((Get-Date) -lt $end) {
    $sp.Write($packet, 0, $packet.Length)
    Start-Sleep -Milliseconds 25
  }
}

$channels = @($From..$To | Where-Object { $_ -notin $Exclude })
if ($channels.Count -eq 0) { throw 'no channel left after -Exclude' }

$sp = New-Object System.IO.Ports.SerialPort $Port, 57600
$sp.ReadTimeout = 1000
try { $sp.Open() } catch { "cannot open ${Port}: $($_.Exception.InnerException.Message) - is Gluehwuermli or EMU still connected?"; exit 1 }

try {
  # label 3: Get Widget Parameters, proves the widget answers; label 10: Get Widget Serial Number (BCD, LSB first)
  $parameters = Request-Reply $sp ([byte[]](0x7E, 0x03, 0x02, 0x00, 0x00, 0x00, 0xE7)) 0x03
  $serialReply = Request-Reply $sp ([byte[]](0x7E, 0x0A, 0x00, 0x00, 0xE7)) 0x0A
  $serial = if ($serialReply) { '{0:X2}{1:X2}{2:X2}{3:X2}' -f $serialReply[7], $serialReply[6], $serialReply[5], $serialReply[4] } else { 'no answer' }
  if ($parameters) {
    "widget on ${Port}: firmware $($parameters[5]).$($parameters[4]), serial $serial, break $($parameters[6]), MAB $($parameters[7]), $($parameters[8]) packets/s"
  } else {
    "WARNING: no answer from a DMX USB Pro on $Port - sending anyway"
  }

  $universe = New-Object byte[] 512
  if ($Chase) {
    foreach ($channel in $channels) {
      [Array]::Clear($universe, 0, 512)
      $universe[$channel - 1] = $Value
      "channel $channel = $Value"
      Send-ForSeconds $sp $universe $StepSeconds
    }
  } elseif ($Alternate) {
    "channels $($channels -join ',') switch between $Value and 0 every $StepSeconds s for $Seconds s ..."
    $end = (Get-Date).AddSeconds($Seconds)
    $level = $Value
    while ((Get-Date) -lt $end) {
      foreach ($channel in $channels) { $universe[$channel - 1] = $level }
      "$(Get-Date -Format HH:mm:ss) = $level"
      Send-ForSeconds $sp $universe $StepSeconds
      $level = if ($level -eq 0) { $Value } else { 0 }
    }
  } else {
    foreach ($channel in $channels) { $universe[$channel - 1] = $Value }
    "channels $($channels -join ',') = $Value for $Seconds s ..."
    Send-ForSeconds $sp $universe $Seconds
  }
} finally {
  if ($sp.IsOpen) {
    $off = New-DmxPacket (New-Object byte[] 512)
    $sp.Write($off, 0, $off.Length)
    Start-Sleep -Milliseconds 100
    $sp.Close()
    'all channels 0'
  }
}
