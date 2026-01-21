#!/bin/bash
cd "$(dirname "$0")/server"
# Run mvn clean first to ensure a fresh build, but this removes protoc executable if we are not careful.
# Actually, mvn clean removes target/. 
# So generated_protos.sh needs to handle missing protoc.
# My script handles it by running `mvn protobuf:compile` if missing (which downloads it).
# But `mvn clean` removes it. 
# So:
# 1. mvn clean -> target gone.
# 2. generate_protos.sh -> runs mvn protobuf:compile (downloads protoc, maybe fails generation but that's ok).
# 3. generate_protos.sh -> runs protoc manually (SUCCESS).
# 4. mvn compile exec:java

mvn clean
chmod +x generate_protos.sh
./generate_protos.sh
mvn compile exec:java -Dexec.mainClass="com.antigravity.App"
