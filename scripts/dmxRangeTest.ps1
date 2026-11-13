<#
.SYNOPSIS
  Sends DMX through an Enttec DMX USB Pro or a Eurolite USB-DMX512 PRO to a range of channels, without any other
  software. Follows the Enttec DMX USB Pro API v1.44 (doc/dmxInterfaces/enttec_dmx_usb_pro/README.md links to it), which
  the Eurolite interface speaks, too.

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

.EXAMPLE
  ./scripts/dmxRangeTest.ps1 -Port COM4 -From 1 -To 512 -Sweep -StepSeconds 4 -Seconds 60
  all channels fade 0 -> 255 -> 0 together, over and over: a fixture reacts whatever its start address and whatever
  channel does its dimmer, shutter or color (some only light up in a part of the range, e.g. a shutter channel)

.NOTES
  Close Gluehwuermli / EMU first: only one program can open the port. All channels go to 0 at the end, also on Ctrl+C.
  Mind lasers and strobes before sending to all channels: -Exclude them.
#>
param(
  [Parameter(Mandatory)][string]$Port,
  [Parameter(Mandatory)][ValidateRange(1, 512)][int]$From,
  [Parameter(Mandatory)][ValidateRange(1, 512)][int]$To,
  [ValidateRange(0, 255)][int]$Value = 255,
  [int[]]$Exclude = @(),
  [ValidateRange(0.1, 86400)][double]$Seconds = 10,
  [switch]$Chase,
  [switch]$Alternate,
  [switch]$Sweep,
  [ValidateRange(0.1, 3600)][double]$StepSeconds = 2
)

if ($To -lt $From) { throw "-To ($To) must not be below -From ($From)" }
if (@($Chase, $Alternate, $Sweep | Where-Object { $_ }).Count -gt 1) { throw '-Chase, -Alternate and -Sweep exclude each other' }
if ($Alternate -and $Value -eq 0) { throw '-Alternate switches between -Value and 0, so -Value must not be 0' }

# a typo in -Exclude would send to a channel that was meant to stay dark (a laser): refuse what can't be meant
$outside = @($Exclude | Where-Object { $_ -lt $From -or $_ -gt $To })
if ($outside.Count -gt 0) { throw "-Exclude $($outside -join ',') is outside -From $From -To $To, is that a typo?" }

$channels = @($From..$To | Where-Object { $_ -notin $Exclude })
if ($channels.Count -eq 0) { throw 'no channel left after -Exclude' }

# --- Enttec framing: 0x7E, label, data length LSB, MSB, data, 0xE7 ---

function New-Message([byte]$label, [byte[]]$data) {
  $message = New-Object byte[] (5 + $data.Length)
  $message[0] = 0x7E
  $message[1] = $label
  $message[2] = $data.Length -band 0xFF
  $message[3] = ($data.Length -shr 8) -band 0xFF
  [Array]::Copy($data, 0, $message, 4, $data.Length)
  $message[$message.Length - 1] = 0xE7
  return , $message
}

# label 6, Output Only Send DMX Packet: start code 0 + always all 512 channels (the data length sets the universe
# size, 25 to 513 bytes), so a fixture addressed anywhere gets data
function New-DmxPacket([byte[]]$universe) {
  $data = New-Object byte[] 513
  [Array]::Copy($universe, 0, $data, 1, 512)
  return , (New-Message 6 $data)
}

# the data of the first complete message with that label and at least $minLength data bytes, or $null; skips other
# messages, e.g. Received DMX (label 5) the widget sends unsolicited while its port is an input
function Find-MessageData([byte[]]$bytes, [byte]$label, [int]$minLength) {
  for ($i = 0; $i + 4 -lt $bytes.Length; $i++) {
    if ($bytes[$i] -ne 0x7E) { continue }
    $length = [int]$bytes[$i + 2] + 256 * [int]$bytes[$i + 3]
    $end = $i + 4 + $length
    if ($length -gt 600 -or $end -ge $bytes.Length -or $bytes[$end] -ne 0xE7) { continue }
    if ($bytes[$i + 1] -ne $label -or $length -lt $minLength) { continue }
    $data = New-Object byte[] $length
    [Array]::Copy($bytes, $i + 4, $data, 0, $length)
    return , $data
  }
  return $null
}

function Request-Reply($sp, [byte[]]$request, [byte]$label, [int]$minLength, [int]$timeoutMs = 1000) {
  $sp.DiscardInBuffer()
  $sp.Write($request, 0, $request.Length)
  $received = New-Object System.Collections.Generic.List[byte]
  $deadline = (Get-Date).AddMilliseconds($timeoutMs)
  while ((Get-Date) -lt $deadline) {
    $count = $sp.BytesToRead
    if ($count -eq 0) { Start-Sleep -Milliseconds 10; continue }
    $chunk = New-Object byte[] $count
    $read = $sp.Read($chunk, 0, $count)
    for ($i = 0; $i -lt $read; $i++) { $received.Add($chunk[$i]) }
    $data = Find-MessageData $received.ToArray() $label $minLength
    if ($null -ne $data) { return , $data }
  }
  return $null
}

function Send-Packet($sp, [byte[]]$packet) {
  try { $sp.Write($packet, 0, $packet.Length) }
  catch [System.TimeoutException] { throw "the widget on $Port takes no data (write timed out)" }
}

function Send-ForSeconds($sp, [byte[]]$universe, [double]$duration) {
  $packet = New-DmxPacket $universe
  $end = (Get-Date).AddSeconds($duration)
  while ((Get-Date) -lt $end) {
    Send-Packet $sp $packet
    Start-Sleep -Milliseconds 25
  }
}

function Set-Channels([byte[]]$universe, [byte]$level) {
  foreach ($channel in $channels) { $universe[$channel - 1] = $level }
}

# 250000 8N2: the Enttec Pro ignores the port settings (a virtual COM port), the Eurolite USB-DMX512 PRO, which
# speaks the same protocol, expects them
$sp = New-Object System.IO.Ports.SerialPort $Port, 250000, ([System.IO.Ports.Parity]::None), 8, ([System.IO.Ports.StopBits]::Two)
$sp.ReadTimeout = 1000
$sp.WriteTimeout = 1000
try { $sp.Open() } catch { "cannot open ${Port}: $($_.Exception.InnerException.Message) - is Gluehwuermli or EMU still connected?"; exit 1 }

try {
  # label 3, Get Widget Parameters (data: user configuration size 0): firmware LSB, MSB, break, MAB, rate
  $parameters = Request-Reply $sp (New-Message 3 ([byte[]](0, 0))) 3 5
  # label 10, Get Widget Serial Number (no data): 4 bytes BCD, LSB first. Any request but labels 6 and 3 stops the
  # output and turns the port into an input, the first DMX packet below turns it back
  $serialData = Request-Reply $sp (New-Message 10 ([byte[]]@())) 10 4
  $serial = if (-not $serialData) { 'no answer' }
  elseif (@($serialData[0..3] | Where-Object { $_ -ne 0xFF }).Count -eq 0) { 'not programmed' }
  else { '{0:X2}{1:X2}{2:X2}{3:X2}' -f $serialData[3], $serialData[2], $serialData[1], $serialData[0] }

  if ($parameters) {
    $firmwareType = switch ($parameters[1]) { 1 { 'DMX' } 2 { 'RDM' } 3 { 'RDM sniffer' } default { 'unknown' } }
    $rate = if ($parameters[4] -eq 0) { 'fastest' } else { "$($parameters[4])" }
    "widget on ${Port}: $firmwareType firmware $($parameters[1]).$($parameters[0]), serial $serial, " +
    "break $($parameters[2]) x 10.67 us, MAB $($parameters[3]) x 10.67 us, $rate packets/s"
    if ($parameters[1] -eq 3) { 'WARNING: RDM sniffer firmware only monitors, it may not send DMX - reflash with DMX firmware' }
  } else {
    "WARNING: no answer from a DMX interface on $Port - sending anyway"
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
    "channels $From-$To$(if ($Exclude) { " without $($Exclude -join ',')" }) switch between $Value and 0 every $StepSeconds s for $Seconds s ..."
    $end = (Get-Date).AddSeconds($Seconds)
    $level = $Value
    while ((Get-Date) -lt $end) {
      Set-Channels $universe $level
      "$(Get-Date -Format HH:mm:ss) = $level"
      Send-ForSeconds $sp $universe $StepSeconds
      $level = if ($level -eq 0) { $Value } else { 0 }
    }
  } elseif ($Sweep) {
    "channels $From-$To$(if ($Exclude) { " without $($Exclude -join ',')" }) fade 0 -> 255 -> 0, $StepSeconds s each way, for $Seconds s ..."
    $end = (Get-Date).AddSeconds($Seconds)
    $rampStart = Get-Date
    $lastShown = -1
    while ((Get-Date) -lt $end) {
      # triangle: 0 -> 255 over StepSeconds, back to 0 over StepSeconds
      $phase = (((Get-Date) - $rampStart).TotalSeconds / $StepSeconds) % 2
      $level = [int][Math]::Round(255 * $(if ($phase -lt 1) { $phase } else { 2 - $phase }))
      Set-Channels $universe $level
      Send-Packet $sp (New-DmxPacket $universe)
      $shown = [int][Math]::Floor($level / 32)
      if ($shown -ne $lastShown) { "$(Get-Date -Format HH:mm:ss) ~ $level"; $lastShown = $shown }
      Start-Sleep -Milliseconds 25
    }
  } else {
    Set-Channels $universe $Value
    "channels $From-$To$(if ($Exclude) { " without $($Exclude -join ',')" }) = $Value for $Seconds s ..."
    Send-ForSeconds $sp $universe $Seconds
  }
} finally {
  if ($sp.IsOpen) {
    try {
      Send-Packet $sp (New-DmxPacket (New-Object byte[] 512))
      Start-Sleep -Milliseconds 100
      'all channels 0'
    } finally { $sp.Close() }
  }
}
