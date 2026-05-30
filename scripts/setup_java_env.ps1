# Centralizes the JDK pin for every Windows entry point. Dot-source from
# run_server.ps1, run_server_headless.ps1, scripts/installer/create_installers.ps1,
# and any future caller that needs to invoke `mvn` / `java` directly.
#
# The caller is responsible for adding $env:JAVA_HOME\bin to $env:Path —
# the prepend pattern differs between dev scripts (simple prepend) and the
# installer build (Machine + User registry composition).

$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot"
