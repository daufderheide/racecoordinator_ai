#!/bin/bash
cd "$(dirname "$0")/server"
mvn clean protobuf:compile compile exec:java -Dexec.mainClass="com.antigravity.App"
