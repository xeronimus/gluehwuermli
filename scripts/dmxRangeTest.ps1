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
  [double]$StepSeconds = 2
)

if ($To -lt $From) { throw "-To ($To) must not be below -From ($From)" }

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
  # label 3: Get Widget Parameters, proves the widget answers
  $sp.DiscardInBuffer()
  [byte[]]$request = 0x7E, 0x03, 0x02, 0x00, 0x00, 0x00, 0xE7
  $sp.Write($request, 0, $request.Length)
  Start-Sleep -Milliseconds 300
  $count = $sp.BytesToRead
  if ($count -ge 9) {
    $reply = New-Object byte[] $count
    [void]$sp.Read($reply, 0, $count)
    "widget on ${Port}: firmware $($reply[5]).$($reply[4]), break $($reply[6]), MAB $($reply[7]), $($reply[8]) packets/s"
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
