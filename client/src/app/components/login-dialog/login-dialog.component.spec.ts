import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AuthService } from "@app/services/auth.service";

import { LoginDialogComponent } from "./login-dialog.component";

describe("LoginDialogComponent", () => {
  let component: LoginDialogComponent;
  let fixture: ComponentFixture<LoginDialogComponent>;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      loginAsDirector: jasmine
        .createSpy("loginAsDirector")
        .and.returnValue(of(true)),
    };

    await TestBed.configureTestingModule({
      imports: [LoginDialogComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should emit close when onClose is called", () => {
    spyOn(component.close, "emit");
    component.password = "some-password";
    component.errorMessage = "some-error";

    component.onClose();

    expect(component.password).toBe("");
    expect(component.errorMessage).toBe("");
    expect(component.close.emit).toHaveBeenCalled();
  });

  it("should clear errorMessage and login via authService on submit (success)", () => {
    spyOn(component.close, "emit");
    component.password = "secret";

    component.onSubmit();

    expect(component.errorMessage).toBe("");
    expect(mockAuthService.loginAsDirector).toHaveBeenCalledWith("secret");
    expect(component.close.emit).toHaveBeenCalled(); // onClose is called
  });

  it("should set errorMessage on submit (failure)", () => {
    spyOn(component.close, "emit");
    mockAuthService.loginAsDirector.and.returnValue(of(false));
    component.password = "wrong";

    component.onSubmit();

    expect(mockAuthService.loginAsDirector).toHaveBeenCalledWith("wrong");
    expect(component.errorMessage).toBe("Invalid password.");
    expect(component.close.emit).not.toHaveBeenCalled();
  });
});
