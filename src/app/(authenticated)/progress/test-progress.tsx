'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/utils/api';

export function TestProgress() {
  const [baseline, setBaseline] = useState({ weight: 75, height: 180 });
  const [snapshot, setSnapshot] = useState({ weight: 77, bodyFat: 15 });
  
  const updateBaseline = api.progress.updateBaseline.useMutation();
  const createSnapshot = api.progress.createSnapshot.useMutation();
  
  const handleSetBaseline = () => {
    updateBaseline.mutate({
      startingWeight: baseline.weight,
      height: baseline.height,
      measurements: { chest: 100, waist: 85 },
    });
  };
  
  const handleCreateSnapshot = () => {
    createSnapshot.mutate({
      date: new Date(),
      weight: snapshot.weight,
      bodyFatPercentage: snapshot.bodyFat,
      measurements: { chest: 102, waist: 83 },
    });
  };
  
  return (
    <Card className="p-6 space-y-4">
      <h3 className="font-semibold">Test Progress Tracking</h3>
      
      <div className="space-y-2">
        <Button onClick={handleSetBaseline} disabled={updateBaseline.isPending}>
          Set Baseline (75kg, 180cm)
        </Button>
        
        <Button onClick={handleCreateSnapshot} disabled={createSnapshot.isPending}>
          Create Snapshot (77kg, 15% BF)
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {updateBaseline.isSuccess && <p>✓ Baseline set successfully</p>}
        {createSnapshot.isSuccess && <p>✓ Snapshot created successfully</p>}
      </div>
    </Card>
  );
}