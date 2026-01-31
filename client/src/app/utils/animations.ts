import {
    trigger,
    transition,
    style,
    query,
    animate,
    group,
} from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
    transition('RacedaySetupPage => RacedayPage', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
            style({
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                opacity: 0,
                transform: 'scale(0.95) translateY(10px)',
            }),
        ]),
        query(':enter', [
            style({ opacity: 0, transform: 'scale(1.05) translateY(20px)' }),
        ]),
        group([
            query(':leave', [
                animate('400ms ease-out', style({ opacity: 0, transform: 'scale(0.95) translateY(-20px)' })),
            ]),
            query(':enter', [
                animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
            ]),
        ]),
    ]),
    transition('RacedayPage => RacedaySetupPage', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
            style({
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
            }),
        ]),
        query(':enter', [
            style({ opacity: 0, transform: 'translateX(-100%)' }),
        ]),
        group([
            query(':leave', [
                animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' })),
            ]),
            query(':enter', [
                animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
            ]),
        ]),
    ]),
    transition('RacedaySetupPage => DriverManagerPage', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
            style({
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                opacity: 0,
            }),
        ]),
        query(':enter', [
            style({ opacity: 0, transform: 'scale(0.8) translateY(100px)', filter: 'blur(10px)' }),
        ]),
        group([
            query(':leave', [
                animate('400ms ease-out', style({ opacity: 0, transform: 'scale(1.2) translateY(-100px)', filter: 'blur(10px)' })),
            ]),
            query(':enter', [
                animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)', filter: 'blur(0)' })),
            ]),
        ]),
    ]),
    transition('DriverManagerPage => RacedaySetupPage', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
            style({
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
            }),
        ]),
        query(':enter', [
            style({ opacity: 0, transform: 'scale(1.2) translateY(-100px)', filter: 'blur(10px)' }),
        ]),
        group([
            query(':leave', [
                animate('400ms ease-out', style({ opacity: 0, transform: 'scale(0.8) translateY(100px)', filter: 'blur(10px)' })),
            ]),
            query(':enter', [
                animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)', filter: 'blur(0)' })),
            ]),
        ]),
    ]),
]);
