import { Routes } from '@angular/router';
import { LibroCatalogComponent } from './features/libro-catalog/libro-catalog.component';

export const routes: Routes = [
    { path: '', redirectTo: 'libros', pathMatch: 'full' },

    { path: 'libros', component: LibroCatalogComponent },

    { path: '**', redirectTo: 'libros' }
];
