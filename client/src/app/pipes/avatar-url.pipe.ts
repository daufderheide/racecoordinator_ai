import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'avatarUrl',
  pure: true,
  standalone: false
})
export class AvatarUrlPipe implements PipeTransform {
  transform(url?: string): string {
    if (!url) return 'assets/images/default_avatar.svg';
    if (url.startsWith('/')) return `http://localhost:7070${url}`;
    return url;
  }
}
