package com.antigravity.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.antigravity.auth.AuthService;
import com.antigravity.auth.Role;
import com.antigravity.service.ServerConfigService;
import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.Handler;
import java.util.Map;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;

public class AuthTaskHandlerTest {

  private ServerConfigService configService;
  private Javalin app;
  private Context ctx;
  private Handler getRoleHandler;
  private Handler loginHandler;
  private Handler changePasswordHandler;
  private Handler getPasswordHandler;

  @Before
  public void setUp() {
    configService = mock(ServerConfigService.class);
    app = mock(Javalin.class);
    ctx = mock(Context.class);

    ArgumentCaptor<Handler> postCaptor = ArgumentCaptor.forClass(Handler.class);
    ArgumentCaptor<Handler> putCaptor = ArgumentCaptor.forClass(Handler.class);
    ArgumentCaptor<Handler> getRoleCaptor = ArgumentCaptor.forClass(Handler.class);
    ArgumentCaptor<Handler> getPasswordCaptor = ArgumentCaptor.forClass(Handler.class);

    new AuthTaskHandler(app, configService);

    verify(app).post(eq("/api/auth/login"), postCaptor.capture(), eq(Role.VIEWER));
    verify(app).put(eq("/api/auth/password"), putCaptor.capture(), eq(Role.ADMIN));
    verify(app).get(eq("/api/auth/role"), getRoleCaptor.capture(), eq(Role.VIEWER));
    verify(app).get(eq("/api/auth/password"), getPasswordCaptor.capture(), eq(Role.ADMIN));

    loginHandler = postCaptor.getValue();
    changePasswordHandler = putCaptor.getValue();
    getRoleHandler = getRoleCaptor.getValue();
    getPasswordHandler = getPasswordCaptor.getValue();
  }

  @Test
  public void testGetRole_LocalAddress_ReturnsAdmin() throws Exception {
    when(ctx.ip()).thenReturn("127.0.0.1");

    getRoleHandler.handle(ctx);

    ArgumentCaptor<Map> mapCaptor = ArgumentCaptor.forClass(Map.class);
    verify(ctx).json(mapCaptor.capture());
    assertEquals("ADMIN", mapCaptor.getValue().get("role"));
  }

  @Test
  public void testGetRole_NonLocalNoAuth_ReturnsViewer() throws Exception {
    when(ctx.ip()).thenReturn("8.8.8.8");
    when(ctx.header("Authorization")).thenReturn(null);

    getRoleHandler.handle(ctx);

    ArgumentCaptor<Map> mapCaptor = ArgumentCaptor.forClass(Map.class);
    verify(ctx).json(mapCaptor.capture());
    assertEquals("VIEWER", mapCaptor.getValue().get("role"));
  }

  @Test
  public void testGetRole_LanPrivateIP_ReturnsViewer() throws Exception {
    when(ctx.ip()).thenReturn("192.168.1.100");
    when(ctx.header("Authorization")).thenReturn(null);

    getRoleHandler.handle(ctx);

    ArgumentCaptor<Map> mapCaptor = ArgumentCaptor.forClass(Map.class);
    verify(ctx).json(mapCaptor.capture());
    assertEquals("VIEWER", mapCaptor.getValue().get("role"));
  }

  @Test
  public void testGetRole_NonLocalValidAuth_ReturnsDirector() throws Exception {
    when(ctx.ip()).thenReturn("8.8.8.8");
    String token = AuthService.getInstance().generateDirectorToken();
    when(ctx.header("Authorization")).thenReturn("Bearer " + token);

    getRoleHandler.handle(ctx);

    ArgumentCaptor<Map> mapCaptor = ArgumentCaptor.forClass(Map.class);
    verify(ctx).json(mapCaptor.capture());
    assertEquals("DIRECTOR", mapCaptor.getValue().get("role"));
  }

  @Test
  public void testGetRole_NonLocalInvalidAuth_ReturnsViewer() throws Exception {
    when(ctx.ip()).thenReturn("8.8.8.8");
    when(ctx.header("Authorization")).thenReturn("Bearer invalid_token");

    getRoleHandler.handle(ctx);

    ArgumentCaptor<Map> mapCaptor = ArgumentCaptor.forClass(Map.class);
    verify(ctx).json(mapCaptor.capture());
    assertEquals("VIEWER", mapCaptor.getValue().get("role"));
  }

  @Test
  public void testLogin_Success() throws Exception {
    when(configService.getDirectorPassword()).thenReturn("secret");

    AuthTaskHandler.LoginRequest req = new AuthTaskHandler.LoginRequest();
    req.password = "secret";
    when(ctx.bodyAsClass(AuthTaskHandler.LoginRequest.class)).thenReturn(req);

    loginHandler.handle(ctx);

    ArgumentCaptor<AuthTaskHandler.LoginResponse> resCaptor =
        ArgumentCaptor.forClass(AuthTaskHandler.LoginResponse.class);
    verify(ctx).json(resCaptor.capture());
    assertTrue(resCaptor.getValue().success);
    assertTrue(AuthService.getInstance().isValidToken(resCaptor.getValue().token));
  }

  @Test
  public void testLogin_Failure_WrongPassword() throws Exception {
    when(configService.getDirectorPassword()).thenReturn("secret");

    AuthTaskHandler.LoginRequest req = new AuthTaskHandler.LoginRequest();
    req.password = "wrong";
    when(ctx.bodyAsClass(AuthTaskHandler.LoginRequest.class)).thenReturn(req);

    when(ctx.status(401)).thenReturn(ctx);

    loginHandler.handle(ctx);

    ArgumentCaptor<AuthTaskHandler.LoginResponse> resCaptor =
        ArgumentCaptor.forClass(AuthTaskHandler.LoginResponse.class);
    verify(ctx).status(401);
    verify(ctx).json(resCaptor.capture());
    assertFalse(resCaptor.getValue().success);
    assertEquals("Invalid password", resCaptor.getValue().error);
  }

  @Test
  public void testLogin_Failure_NoPasswordConfigured() throws Exception {
    when(configService.getDirectorPassword()).thenReturn("");

    AuthTaskHandler.LoginRequest req = new AuthTaskHandler.LoginRequest();
    req.password = "secret";
    when(ctx.bodyAsClass(AuthTaskHandler.LoginRequest.class)).thenReturn(req);

    when(ctx.status(401)).thenReturn(ctx);

    loginHandler.handle(ctx);

    ArgumentCaptor<AuthTaskHandler.LoginResponse> resCaptor =
        ArgumentCaptor.forClass(AuthTaskHandler.LoginResponse.class);
    verify(ctx).status(401);
    verify(ctx).json(resCaptor.capture());
    assertFalse(resCaptor.getValue().success);
    assertEquals("Director password is not configured.", resCaptor.getValue().error);
  }

  @Test
  public void testChangePassword_Success() throws Exception {
    AuthTaskHandler.ChangePasswordRequest req = new AuthTaskHandler.ChangePasswordRequest();
    req.newPassword = "newsecret";
    when(ctx.bodyAsClass(AuthTaskHandler.ChangePasswordRequest.class)).thenReturn(req);
    when(ctx.status(200)).thenReturn(ctx);

    changePasswordHandler.handle(ctx);

    verify(configService).setDirectorPassword("newsecret");
    verify(ctx).status(200);
    ArgumentCaptor<Map> mapCaptor = ArgumentCaptor.forClass(Map.class);
    verify(ctx).json(mapCaptor.capture());
    assertEquals(true, mapCaptor.getValue().get("success"));
  }

  @Test
  public void testGetPassword_ReturnsConfiguredPassword() throws Exception {
    when(configService.getDirectorPassword()).thenReturn("my-secret-pwd");

    getPasswordHandler.handle(ctx);

    ArgumentCaptor<Map> mapCaptor = ArgumentCaptor.forClass(Map.class);
    verify(ctx).json(mapCaptor.capture());
    assertEquals("my-secret-pwd", mapCaptor.getValue().get("password"));
  }
}
