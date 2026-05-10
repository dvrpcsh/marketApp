@ECHO OFF
REM Windows 콘솔 코드 페이지를 UTF-8(65001)로 변경
REM JVM이 UTF-8 바이트를 출력하더라도 콘솔이 CP949로 해석하면 한글이 깨짐
REM chcp 65001은 현재 콘솔 전체(PowerShell 포함)의 코드 페이지를 변경함
chcp 65001 > nul

ECHO [백엔드 서버 시작 - UTF-8 모드]
.\gradlew.bat :backend:bootRun
