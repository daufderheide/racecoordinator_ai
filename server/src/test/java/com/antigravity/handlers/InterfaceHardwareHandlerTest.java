package com.antigravity.handlers;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import io.javalin.http.Context;
import java.util.Collections;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.junit.Before;
import org.junit.Test;

public class InterfaceHardwareHandlerTest {

  private InterfaceHardwareHandler handler;
  private Context ctx;

  @Before
  public void setUp() {
    handler = new InterfaceHardwareHandler();
    HttpServletRequest req = mock(HttpServletRequest.class);
    HttpServletResponse res = mock(HttpServletResponse.class);
    ctx = new Context(req, res, Collections.emptyMap());
  }

  @Test
  public void testGetBleDevices_ShouldNotCrash() {
    handler.getBleDevices(ctx);
  }

  @Test
  public void testGetSerialPorts_ShouldNotCrash() {
    handler.getSerialPorts(ctx);
  }

  @Test
  public void testCloseInterface() {
    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(mockCtx);

    handler.closeInterface(mockCtx);
    org.mockito.Mockito.verify(mockCtx).status(200);
    org.mockito.Mockito.verify(mockCtx).result("OK");
  }

  @Test
  public void testPowerCommands_WithoutActiveProtocol_Returns404() {
    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(null);
    com.antigravity.race.ClientSubscriptionManager.getInstance().setProtocol(null);

    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.queryParam("on")).thenReturn("true");
    when(mockCtx.pathParam("lane")).thenReturn("1");
    when(mockCtx.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(mockCtx);

    handler.setMainPower(mockCtx);
    org.mockito.Mockito.verify(mockCtx).status(404);

    handler.setLanePower(mockCtx);
    org.mockito.Mockito.verify(mockCtx, org.mockito.Mockito.times(2)).status(404);
  }

  @Test
  public void testPowerCommands_WithActiveRace() {
    com.antigravity.race.Race mockRace = org.mockito.Mockito.mock(com.antigravity.race.Race.class);
    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(mockRace);

    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.queryParam("on")).thenReturn("true");
    when(mockCtx.pathParam("lane")).thenReturn("2");
    when(mockCtx.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(mockCtx);

    handler.setMainPower(mockCtx);
    org.mockito.Mockito.verify(mockRace).forceUserMainPower(true);
    org.mockito.Mockito.verify(mockCtx).status(200);

    handler.setLanePower(mockCtx);
    org.mockito.Mockito.verify(mockRace).setLanePower(true, 1);
    org.mockito.Mockito.verify(mockCtx, org.mockito.Mockito.times(2)).status(200);
  }

  @Test
  public void testPowerCommands_WithActiveProtocol() {
    com.antigravity.race.ClientSubscriptionManager.getInstance().setRace(null);
    com.antigravity.protocols.ProtocolDelegate mockProto =
        org.mockito.Mockito.mock(com.antigravity.protocols.ProtocolDelegate.class);
    com.antigravity.race.ClientSubscriptionManager.getInstance().setProtocol(mockProto);

    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.queryParam("on")).thenReturn("false");
    when(mockCtx.pathParam("lane")).thenReturn("1");
    when(mockCtx.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(mockCtx);

    handler.setMainPower(mockCtx);
    org.mockito.Mockito.verify(mockProto).setMainPower(false);
    org.mockito.Mockito.verify(mockCtx).status(200);

    handler.setLanePower(mockCtx);
    org.mockito.Mockito.verify(mockProto).setLanePower(false, 0);
    org.mockito.Mockito.verify(mockCtx, org.mockito.Mockito.times(2)).status(200);
  }

  @Test
  public void testUpdateInterfaceConfig_InvalidProtocolIndex() {
    com.antigravity.race.ClientSubscriptionManager.getInstance().setProtocol(null);

    com.antigravity.proto.UpdateInterfaceConfigRequest req =
        com.antigravity.proto.UpdateInterfaceConfigRequest.newBuilder()
            .setInterfaceIndex(0)
            .setConfig(com.antigravity.proto.ArduinoConfig.newBuilder().setName("Arduino1").build())
            .build();

    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.bodyAsBytes()).thenReturn(req.toByteArray());
    when(mockCtx.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(mockCtx);

    handler.updateInterfaceConfig(mockCtx);
    org.mockito.Mockito.verify(mockCtx).result(org.mockito.ArgumentMatchers.any(byte[].class));
  }

  @Test
  public void testSetInterfacePinAndLedState_InvalidProtocolIndex() {
    com.antigravity.race.ClientSubscriptionManager.getInstance().setProtocol(null);

    com.antigravity.proto.SetInterfacePinStateRequest pinReq =
        com.antigravity.proto.SetInterfacePinStateRequest.newBuilder()
            .setInterfaceIndex(0)
            .setPin(5)
            .setIsDigital(true)
            .setIsHigh(true)
            .build();

    io.javalin.http.Context mockCtx1 = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx1.bodyAsBytes()).thenReturn(pinReq.toByteArray());
    when(mockCtx1.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(mockCtx1);

    handler.setInterfacePinState(mockCtx1);
    org.mockito.Mockito.verify(mockCtx1).result(org.mockito.ArgumentMatchers.any(byte[].class));

    com.antigravity.proto.SetInterfaceRgbLedStateRequest ledReq =
        com.antigravity.proto.SetInterfaceRgbLedStateRequest.newBuilder()
            .setInterfaceIndex(0)
            .setPin(6)
            .addLeds(
                com.antigravity.proto.RgbLedState.newBuilder().setR(255).setG(0).setB(0).build())
            .build();

    io.javalin.http.Context mockCtx2 = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx2.bodyAsBytes()).thenReturn(ledReq.toByteArray());
    when(mockCtx2.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(mockCtx2);

    handler.setInterfaceRgbLedState(mockCtx2);
    org.mockito.Mockito.verify(mockCtx2).result(org.mockito.ArgumentMatchers.any(byte[].class));
  }

  @Test
  public void testInitializeInterface_WithArduinoTrackmateBart() {
    com.antigravity.proto.InitializeInterfaceRequest req =
        com.antigravity.proto.InitializeInterfaceRequest.newBuilder()
            .setLaneCount(4)
            .addConfigs(com.antigravity.proto.ArduinoConfig.newBuilder().setName("Ard1").build())
            .addTrackmateConfigs(
                com.antigravity.proto.TrackmateConfig.newBuilder().setName("TM1").build())
            .addBartConfigs(com.antigravity.proto.BartConfig.newBuilder().setName("Bart1").build())
            .build();

    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.bodyAsBytes()).thenReturn(req.toByteArray());
    when(mockCtx.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(mockCtx);

    handler.initializeInterface(mockCtx);
    org.mockito.Mockito.verify(mockCtx).result(org.mockito.ArgumentMatchers.any(byte[].class));
  }

  @Test
  public void testGetPhidgetDevices_ShouldReturnResponse() {
    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.status(org.mockito.ArgumentMatchers.anyInt())).thenReturn(mockCtx);
    when(mockCtx.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(mockCtx);

    handler.getPhidgetDevices(mockCtx);
    org.mockito.Mockito.verify(mockCtx).status(org.mockito.ArgumentMatchers.anyInt());
  }

  @Test
  public void testUpdateInterfaceConfig_WithPhidgetProtocol() {
    com.antigravity.protocols.phidget.PhidgetConfig config =
        new com.antigravity.protocols.phidget.PhidgetConfig();
    config.serialNumber = 12345;
    com.antigravity.protocols.phidget.PhidgetProtocol phidgetProtocol =
        new com.antigravity.protocols.phidget.PhidgetProtocol(config, 4, null);
    phidgetProtocol.setInterfaceIndex(0);

    com.antigravity.protocols.ProtocolDelegate delegate =
        new com.antigravity.protocols.ProtocolDelegate(Collections.singletonList(phidgetProtocol));
    com.antigravity.race.ClientSubscriptionManager.getInstance().setProtocol(delegate);

    com.antigravity.proto.UpdateInterfaceConfigRequest req =
        com.antigravity.proto.UpdateInterfaceConfigRequest.newBuilder()
            .setInterfaceIndex(0)
            .setPhidgetConfig(
                com.antigravity.proto.PhidgetConfig.newBuilder()
                    .setName("Updated Phidget")
                    .setSerialNumber(54321)
                    .build())
            .build();

    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.bodyAsBytes()).thenReturn(req.toByteArray());
    when(mockCtx.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(mockCtx);

    handler.updateInterfaceConfig(mockCtx);
    org.mockito.Mockito.verify(mockCtx).result(org.mockito.ArgumentMatchers.any(byte[].class));
  }

  @Test
  public void testSetInterfacePinState_WithPhidgetProtocol() throws Exception {
    com.antigravity.protocols.phidget.PhidgetConfig config =
        new com.antigravity.protocols.phidget.PhidgetConfig();
    config.serialNumber = 12345;
    com.antigravity.protocols.phidget.PhidgetProtocol phidgetProtocol =
        new com.antigravity.protocols.phidget.PhidgetProtocol(config, 4, null);
    phidgetProtocol.setInterfaceIndex(0);

    com.antigravity.protocols.ProtocolDelegate delegate =
        new com.antigravity.protocols.ProtocolDelegate(Collections.singletonList(phidgetProtocol));
    com.antigravity.race.ClientSubscriptionManager.getInstance().setProtocol(delegate);

    com.antigravity.proto.SetInterfacePinStateRequest pinReq =
        com.antigravity.proto.SetInterfacePinStateRequest.newBuilder()
            .setInterfaceIndex(0)
            .setPin(2)
            .setIsDigital(true)
            .setIsHigh(true)
            .build();

    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.bodyAsBytes()).thenReturn(pinReq.toByteArray());
    when(mockCtx.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(mockCtx);

    org.mockito.ArgumentCaptor<byte[]> responseCaptor =
        org.mockito.ArgumentCaptor.forClass(byte[].class);

    handler.setInterfacePinState(mockCtx);
    org.mockito.Mockito.verify(mockCtx).result(responseCaptor.capture());

    com.antigravity.proto.SetInterfacePinStateResponse resp =
        com.antigravity.proto.SetInterfacePinStateResponse.parseFrom(responseCaptor.getValue());
    org.junit.Assert.assertFalse(resp.getSuccess());
    org.junit.Assert.assertTrue(resp.getMessage().contains("not attached"));
  }

  @Test
  public void testSetInterfacePinState_WithAttachedPhidget_ReturnsSuccess() throws Exception {
    com.antigravity.protocols.phidget.PhidgetConfig config =
        new com.antigravity.protocols.phidget.PhidgetConfig();
    config.serialNumber = 12345;
    com.antigravity.protocols.phidget.PhidgetProtocol phidgetProtocol =
        org.mockito.Mockito.spy(
            new com.antigravity.protocols.phidget.PhidgetProtocol(config, 4, null));
    phidgetProtocol.setInterfaceIndex(0);
    org.mockito.Mockito.doReturn(true).when(phidgetProtocol).setPinState(true, 1, true);

    com.antigravity.protocols.ProtocolDelegate delegate =
        new com.antigravity.protocols.ProtocolDelegate(Collections.singletonList(phidgetProtocol));
    com.antigravity.race.ClientSubscriptionManager.getInstance().setProtocol(delegate);

    com.antigravity.proto.SetInterfacePinStateRequest pinReq =
        com.antigravity.proto.SetInterfacePinStateRequest.newBuilder()
            .setInterfaceIndex(0)
            .setPin(1)
            .setIsDigital(true)
            .setIsHigh(true)
            .build();

    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.bodyAsBytes()).thenReturn(pinReq.toByteArray());
    when(mockCtx.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(mockCtx);

    org.mockito.ArgumentCaptor<byte[]> responseCaptor =
        org.mockito.ArgumentCaptor.forClass(byte[].class);

    handler.setInterfacePinState(mockCtx);
    org.mockito.Mockito.verify(mockCtx).result(responseCaptor.capture());

    com.antigravity.proto.SetInterfacePinStateResponse resp =
        com.antigravity.proto.SetInterfacePinStateResponse.parseFrom(responseCaptor.getValue());
    org.junit.Assert.assertTrue(resp.getSuccess());
  }

  @Test
  public void testSetInterfacePinState_InvalidInterfaceIndex_ReturnsFailure() throws Exception {
    com.antigravity.race.ClientSubscriptionManager.getInstance().setProtocol(null);

    com.antigravity.proto.SetInterfacePinStateRequest pinReq =
        com.antigravity.proto.SetInterfacePinStateRequest.newBuilder()
            .setInterfaceIndex(99)
            .setPin(0)
            .setIsDigital(true)
            .setIsHigh(true)
            .build();

    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.bodyAsBytes()).thenReturn(pinReq.toByteArray());
    when(mockCtx.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(mockCtx);

    org.mockito.ArgumentCaptor<byte[]> responseCaptor =
        org.mockito.ArgumentCaptor.forClass(byte[].class);

    handler.setInterfacePinState(mockCtx);
    org.mockito.Mockito.verify(mockCtx).result(responseCaptor.capture());

    com.antigravity.proto.SetInterfacePinStateResponse resp =
        com.antigravity.proto.SetInterfacePinStateResponse.parseFrom(responseCaptor.getValue());
    org.junit.Assert.assertFalse(resp.getSuccess());
    org.junit.Assert.assertTrue(resp.getMessage().contains("invalid or unsupported"));
  }

  @Test
  public void testInitializeInterface_WithPhidgetConfigs() {
    com.antigravity.proto.InitializeInterfaceRequest req =
        com.antigravity.proto.InitializeInterfaceRequest.newBuilder()
            .setLaneCount(4)
            .addPhidgetConfigs(
                com.antigravity.proto.PhidgetConfig.newBuilder()
                    .setName("Phidget 1")
                    .setSerialNumber(-1)
                    .build())
            .build();

    io.javalin.http.Context mockCtx = org.mockito.Mockito.mock(io.javalin.http.Context.class);
    when(mockCtx.bodyAsBytes()).thenReturn(req.toByteArray());
    when(mockCtx.contentType(org.mockito.ArgumentMatchers.anyString())).thenReturn(mockCtx);

    handler.initializeInterface(mockCtx);
    org.mockito.Mockito.verify(mockCtx).result(org.mockito.ArgumentMatchers.any(byte[].class));
  }
}
