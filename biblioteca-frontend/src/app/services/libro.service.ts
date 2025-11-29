import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Libro } from '../models/libro.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class LibroService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // 1. Obtener TODOS o Buscar (Endpoint General)
  getAll(term: string = ''): Observable<Libro[]> {
    // Si hay término, el backend busca. Si no, trae todos.
    const url = term ? `${this.apiUrl}?busqueda=${term}` : this.apiUrl;
    return this.http.get<Libro[]>(url);
  }

  // 2. Obtener por Estado (Endpoints Específicos creados en Hexagonal)
  // Llama a /api/libros/disponibles o /api/libros/prestados
  getByStatus(status: 'disponibles' | 'prestados'): Observable<Libro[]> {
    return this.http.get<Libro[]>(`${this.apiUrl}/${status}`);
  }

  create(libro: Libro): Observable<Libro> {
    return this.http.post<Libro>(this.apiUrl, libro);
  }

  update(id: number, libro: Libro): Observable<Libro> {
    return this.http.put<Libro>(`${this.apiUrl}/${id}`, libro);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleLoan(id: number, devolver: boolean): Observable<Libro> {
    const action = devolver ? 'devolver' : 'prestar';
    return this.http.patch<Libro>(`${this.apiUrl}/${id}/${action}`, {});
  }
}
