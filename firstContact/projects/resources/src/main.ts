import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

export const mount = async (container: HTMLElement) => {
  container.innerHTML = '';
  const appElement = document.createElement('app-root');
  container.appendChild(appElement);

  const appRef = await bootstrapApplication(App);

  // Return unmount function for cleanup when leaving route
  return () => {
    appRef.destroy();
  };
};