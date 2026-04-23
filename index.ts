import express from 'express';
import cors from 'cors';
import { v7 as uuidv7 } from 'uuid';
import type { Request, Response } from 'express';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

interface Profile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  gender_probability: number;
  age: number;
  age_group: 'child' | 'teenager' | 'adult' | 'senior';
  country_id: string;
  country_name: string;
  country_probability: number;
  created_at: string;
}

interface ProfilesQuery {
  gender?: string;
  age_group?: string;
  country_id?: string;
  min_age?: string;
  max_age?: string;
  min_gender_probability?: string;
  min_country_probability?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  page?: string;
  limit?: string;
}

interface SearchFilters {
  gender?: string;
  min_age?: number;
  max_age?: number;
  age_group?: string;
  country_id?: string;
}

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Load/Save profiles to JSON file
const dataPath = path.join(process.cwd(), 'data/profiles.json');

let profiles: Profile[] = [];

try {
  const data = readFileSync(dataPath, 'utf8');
  profiles = JSON.parse(data) as Profile[];
  if (profiles.length === 0) {
    // Generate if empty
    for (let i = 0; i < 2026; i++) {
      profiles.push({
        id: uuidv7(),
        name: `Person ${i + 1}`,
        gender: i % 2 === 0 ? 'male' : 'female',
        gender_probability: Math.random(),
        age: Math.floor(Math.random() * 100),
        age_group: i % 4 === 0 ? 'child' : i % 4 === 1 ? 'teenager' : i % 4 === 2 ? 'adult' : 'senior',
        country_id: i % 3 === 0 ? 'NG' : i % 3 === 1 ? 'BJ' : 'GH',
        country_name: i % 3 === 0 ? 'Nigeria' : i % 3 === 1 ? 'Benin' : 'Ghana',
        country_probability: Math.random(),
        created_at: new Date().toISOString(),
      });
    }
    writeFileSync(dataPath, JSON.stringify(profiles, null, 2));
  }
} catch (error) {
  console.error('Failed to load profiles, generating new ones');
  // Generate and save
  for (let i = 0; i < 2026; i++) {
    profiles.push({
      id: uuidv7(),
      name: `Person ${i + 1}`,
      gender: i % 2 === 0 ? 'male' : 'female',
      gender_probability: Math.random(),
      age: Math.floor(Math.random() * 100),
      age_group: i % 4 === 0 ? 'child' : i % 4 === 1 ? 'teenager' : i % 4 === 2 ? 'adult' : 'senior',
      country_id: i % 3 === 0 ? 'NG' : i % 3 === 1 ? 'BJ' : 'GH',
      country_name: i % 3 === 0 ? 'Nigeria' : i % 3 === 1 ? 'Benin' : 'Ghana',
      country_probability: Math.random(),
      created_at: new Date().toISOString(),
    });
  }
  writeFileSync(dataPath, JSON.stringify(profiles, null, 2));
}



// Get all profiles with filtering, sorting, and pagination
app.get('/api/profiles', (req: Request<{}, {}, {}, ProfilesQuery>, res: Response) => {
  try {
    const { 
      gender, 
      age_group, 
      country_id, 
      min_age, 
      max_age, 
      min_gender_probability, 
      min_country_probability, 
      sort_by, 
      order = 'asc', 
      page = '1', 
      limit = '10' 
    } = req.query as ProfilesQuery;

    // Validation
    const validGenders = ['male', 'female'];
    const validAgeGroups = ['child', 'teenager', 'adult', 'senior'];
    const validOrders = ['asc', 'desc'];
    const allowedSortFields: (keyof Profile)[] = ['name', 'age', 'gender_probability', 'country_probability'];

    if (gender && !validGenders.includes(gender)) {
      return res.status(400).json({ status: 'error', message: `Invalid gender. Must be one of: ${validGenders.join(', ')}` });
    }
    if (age_group && !validAgeGroups.includes(age_group)) {
      return res.status(400).json({ status: 'error', message: `Invalid age_group. Must be one of: ${validAgeGroups.join(', ')}` });
    }
    if (min_age && (isNaN(Number(min_age)) || Number(min_age) < 0 || Number(min_age) > 120)) {
      return res.status(400).json({ status: 'error', message: 'min_age must be number 0-120' });
    }
    if (max_age && (isNaN(Number(max_age)) || Number(max_age) < 0 || Number(max_age) > 120)) {
      return res.status(400).json({ status: 'error', message: 'max_age must be number 0-120' });
    }
    if (min_age && max_age && Number(min_age) > Number(max_age)) {
      return res.status(400).json({ status: 'error', message: 'min_age cannot exceed max_age' });
    }
    if (sort_by && !allowedSortFields.includes(sort_by as keyof Profile)) {
      return res.status(400).json({ status: 'error', message: `Invalid sort_by. Allowed: ${allowedSortFields.join(', ')}` });
    }
    if (order && !validOrders.includes(order)) {
      return res.status(400).json({ status: 'error', message: `Invalid order. Must be 'asc' or 'desc'` });
    }
    let pageNum = Number(page) || 1;
    let limitNum = Math.min(Number(limit) || 10, 100);
    if (pageNum < 1) pageNum = 1;


    let result = [...profiles];

    if (gender) result = result.filter(p => p.gender === gender);
    if (age_group) result = result.filter(p => p.age_group === age_group);
    if (country_id) result = result.filter(p => p.country_id === country_id);
    if (min_age) result = result.filter(p => p.age >= Number(min_age));
    if (max_age) result = result.filter(p => p.age <= Number(max_age));
    if (min_gender_probability) result = result.filter(p => p.gender_probability >= Number(min_gender_probability));
    if (min_country_probability) result = result.filter(p => p.country_probability >= Number(min_country_probability));

    if (sort_by && allowedSortFields.includes(sort_by as keyof Profile)) {
      result = result.sort((a, b) => {
        const aVal = a[sort_by as keyof Profile];
        const bVal = b[sort_by as keyof Profile];
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = result.length;
    const offset = (pageNum - 1) * limitNum;
    result = result.slice(offset, offset + limitNum);

    res.json({
      status: 'success',
      page: pageNum,
      limit: limitNum,
      total,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});





// Natural Language Query Endpoint
app.get('/api/profiles/search', (req: Request<{}, {}, {}, { q?: string }>, res: Response) => {
  const { q } = req.query as { q?: string };
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ status: 'error', message: 'Query parameter "q" is required and must be string' });
  }

  const query = q.toLowerCase();

  let filters: SearchFilters = {};
  if (query.includes('young males')) {
    filters = { gender: 'male', min_age: 16, max_age: 24 };
  } else if (query.includes('females above 30')) {
    filters = { gender: 'female', min_age: 30 };
  } else if (query.includes('people from angola') || query.includes('angola')) {
    filters = { country_id: 'AO' };
  } else if (query.includes('adult males from kenya')) {
    filters = { gender: 'male', age_group: 'adult', country_id: 'KE' };
  } else if (query.includes('teenagers above 17')) {
    filters = { age_group: 'teenager', min_age: 17 };
  } else {
    return res.status(422).json({ status: 'error', message: 'Unable to interpret query. Try: young males, females above 30, people from angola, etc.' });
  }

  const filteredProfiles = profiles.filter(profile => {
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'gender' && profile.gender !== value) return false;
      if (key === 'age_group' && profile.age_group !== value) return false;
      if (key === 'country_id' && profile.country_id !== value) return false;
      if (key === 'min_age' && profile.age < (value as number)) return false;
      if (key === 'max_age' && profile.age > (value as number)) return false;
    }
    return true;
  });

  res.json({
    status: 'success',
    page: 1,
    limit: filteredProfiles.length,
    total: filteredProfiles.length,
    data: filteredProfiles,
  });
});


// Global error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

