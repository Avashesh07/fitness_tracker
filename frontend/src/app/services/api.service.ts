import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WeightEntry {
  date: string;
  weight: number | string;
}

export interface CalorieEntry {
  date: string;
  caloriesEaten: number | string;
  caloriesBurnt: number | string;
}

export interface WorkoutEntry {
  date: string;
  cardio: boolean | string;
  strength: boolean | string;
  restDay: boolean | string;
  cardioMinutes: number | string;
  strengthMinutes: number | string;
  notes: string;
}

export interface Stats {
  totalEntries: number;
  startWeight: number | null;
  currentWeight: number | null;
  weightLost: number;
  avgCaloriesEaten: number;
  avgCaloriesBurnt: number;
  totalWorkouts: number;
  cardioSessions: number;
  strengthSessions: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Weight endpoints
  getWeights(): Observable<WeightEntry[]> {
    return this.http.get<WeightEntry[]>(`${this.baseUrl}/weight`);
  }

  addWeight(entry: WeightEntry): Observable<any> {
    return this.http.post(`${this.baseUrl}/weight`, entry);
  }

  deleteWeight(date: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/weight/${date}`);
  }

  // Calorie endpoints
  getCalories(): Observable<CalorieEntry[]> {
    return this.http.get<CalorieEntry[]>(`${this.baseUrl}/calories`);
  }

  addCalories(entry: CalorieEntry): Observable<any> {
    return this.http.post(`${this.baseUrl}/calories`, entry);
  }

  deleteCalories(date: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/calories/${date}`);
  }

  // Workout endpoints
  getWorkouts(): Observable<WorkoutEntry[]> {
    return this.http.get<WorkoutEntry[]>(`${this.baseUrl}/workouts`);
  }

  addWorkout(entry: WorkoutEntry): Observable<any> {
    return this.http.post(`${this.baseUrl}/workouts`, entry);
  }

  deleteWorkout(date: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/workouts/${date}`);
  }

  // Stats endpoint
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.baseUrl}/stats`);
  }
}


