// src/app/page.tsx (o cualquier otro componente)
'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [songs, setSongs] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('songs')
      .select('*')
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setSongs(data || []);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">🎶 Canciones</h1>
      <ul className="mt-4 space-y-2">
        {songs.map((song) => (
          <li key={song.id} className="bg-gray-100 p-2 rounded">
            {song.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
