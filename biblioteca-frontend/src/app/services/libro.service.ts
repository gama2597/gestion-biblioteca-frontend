import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Libro } from 'src/app/models/libro.model';

@Injectable({
  providedIn: 'root',
})
export class LibroService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // getAll(term: string = ''): Observable<Libro[]> {
  //   const url = term ? `${this.apiUrl}?busqueda=${term}` : this.apiUrl;
  //   return this.http.get<Libro[]>(url);
  // }
  // Método inteligente: Busca por texto O por estado
  getBooks(
    status: 'todos' | 'disponibles' | 'prestados',
    term: string = ''
  ): Observable<Libro[]> {
    let url = this.apiUrl;

    // 1. Si no es 'todos', ajustamos la URL a /disponibles o /prestados
    if (status !== 'todos') {
      url = `${this.apiUrl}/${status}`;
    }

    // 2. Si hay término de búsqueda, lo agregamos como query param
    if (term) {
      // Nota: Si tu backend soporta búsqueda + filtro a la vez, úsalo.
      // Si no, priorizamos la búsqueda general:
      url = `${this.apiUrl}?busqueda=${term}`;
    }

    return this.http.get<Libro[]>(url);
  }

  create(book: Libro): Observable<Libro> {
    return this.http.post<Libro>(this.apiUrl, book);
  }

  update(id: number, book: Libro): Observable<Libro> {
    return this.http.put<Libro>(`${this.apiUrl}/${id}`, book);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Lógica de negocio: Prestar o Devolver
  toggleLoan(id: number, devolver: boolean): Observable<Libro> {
    const action = devolver ? 'devolver' : 'prestar';
    return this.http.patch<Libro>(`${this.apiUrl}/${id}/${action}`, {});
  }
}
