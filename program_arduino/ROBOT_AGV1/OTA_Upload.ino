//Over The Air (OTA) update method

IPAddress local_IP(192, 168, 0, 10);    // Desired IP address 10 AGV1 11 AGV2 12 Server
IPAddress gateway(192, 168, 0, 1);      // Router's IP address
IPAddress subnet(255, 255, 255, 0);     // Subnet mask
IPAddress primary_DNS(192, 168, 0, 1);  //

void OTA() {
  Serial.begin(115200);
  Serial.println("Booting");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  if (!WiFi.config(local_IP, gateway, subnet, primary_DNS)) Serial.println("STA Failed to configure");
  while (WiFi.waitForConnectResult() != WL_CONNECTED) {
    Serial.println("Connection Failed! Rebooting...");
    delay(5000);
    ESP.restart();
  }

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(200, "text/plain", "Hi! I am ESP32 for AGV 2");
  });

  server.begin();
  Serial.println("HTTP server started");

  ElegantOTA.begin(&server);

  Serial.println("Ready");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}
