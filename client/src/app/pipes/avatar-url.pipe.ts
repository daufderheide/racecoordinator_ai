import { Pipe, PipeTransform } from '@angular/core';
import { DataService } from '../data.service';

@Pipe({
  name: 'avatarUrl',
  pure: true,
  standalone: false
})
export class AvatarUrlPipe implements PipeTransform {
  constructor(private dataService: DataService) { }

  transform(url?: string): string {
    if (!url) return 'assets/images/default_avatar.svg';
    if (url.startsWith('/')) return `${this.dataService.serverUrl}${url}`;
    return url;
  }
}
