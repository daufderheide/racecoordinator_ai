#!/bin/bash
cd "$(dirname "$0")/server"
mvn clean
mvn protobuf:compile
mvn compile
mvn exec:java -Dexec.mainClass="com.antigravity.App"
