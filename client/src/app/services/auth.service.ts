import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { DataService } from "@app/data.service";
import { Role } from "@app/models/role";
import { LoggerService } from "@app/services/logger.service";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly TOKEN_KEY = "director_token";
  private readonly PASSWORD_KEY = "director_password";
  private currentRoleSubject = new BehaviorSubject<Role>(Role.VIEWER);
  public currentRole$ = this.currentRoleSubject.asObservable();

  private roleInitializedSubject = new BehaviorSubject<boolean>(false);
  public roleInitialized$ = this.roleInitializedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private logger: LoggerService,
  ) {
    this.checkInitialRole();
  }

  public get currentRole(): Role {
    return this.currentRoleSubject.value;
  }

  public get token(): string | null {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  private checkInitialRole(): void {
    // Call the server to get our role. It will use the token or our IP to determine it.
    this.fetchRoleFromServer().subscribe((role) => {
      // If we are still VIEWER and we have a saved password, try to auto-login
      if (role === Role.VIEWER && typeof localStorage !== "undefined") {
        const savedPassword = localStorage.getItem(this.PASSWORD_KEY);
        if (savedPassword) {
          this.loginAsDirector(savedPassword).subscribe();
        }
      }
    });
  }

  public fetchRoleFromServer(): Observable<Role> {
    const url = `${this.dataService.serverUrl}/api/auth/role`;
    this.logger.debug("Fetching role from server: " + url);
    return this.http.get<{ role: Role }>(url).pipe(
      map((response) => {
        this.logger.debug("Got role from server: " + response.role);
        return response.role;
      }),
      catchError((err) => {
        this.logger.warn("Error fetching role from server: " + err.message);
        return of(Role.VIEWER);
      }),
      tap((role) => {
        this.logger.debug("Setting current role to: " + role);
        this.currentRoleSubject.next(role);
        this.roleInitializedSubject.next(true);
      }),
    );
  }

  public loginAsDirector(password: string): Observable<boolean> {
    const url = `${this.dataService.serverUrl}/api/auth/login`;
    return this.http
      .post<{ token: string; role: Role }>(url, { password })
      .pipe(
        map((response) => {
          if (response.token) {
            if (typeof localStorage !== "undefined") {
              localStorage.setItem(this.TOKEN_KEY, response.token);
              localStorage.setItem(this.PASSWORD_KEY, password);
            }
            this.currentRoleSubject.next(response.role);
            return true;
          }
          return false;
        }),
        catchError(() => of(false)),
      );
  }

  public getDirectorPassword(): Observable<string> {
    const url = `${this.dataService.serverUrl}/api/auth/password`;
    return this.http.get<{ password: string }>(url).pipe(
      map((response) => response.password),
      catchError(() => of("")),
    );
  }

  public changeDirectorPassword(newPassword: string): Observable<boolean> {
    const url = `${this.dataService.serverUrl}/api/auth/password`;
    return this.http.put(url, { newPassword }).pipe(
      map(() => {
        if (
          typeof localStorage !== "undefined" &&
          localStorage.getItem(this.PASSWORD_KEY)
        ) {
          localStorage.setItem(this.PASSWORD_KEY, newPassword);
        }
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  public logout(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.PASSWORD_KEY);
    }
    this.fetchRoleFromServer().subscribe();
  }
}
