#!/bin/bash
cd "$(dirname "$0")/server"
mvn compile exec:java -Dexec.mainClass="com.antigravity.App"
