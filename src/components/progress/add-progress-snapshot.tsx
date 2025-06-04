'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import { Camera, Plus, Ruler, Weight, Upload, X } from 'lucide-react';
import Image from 'next/image';

export function AddProgressSnapshot() {
  const { toast } = useToast();
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      thighs: '',
      arms: '',
      neck: '',
    },
    notes: '',
  });

  const uploadPhoto = api.workouts.uploadPhoto.useMutation();
  const createSnapshot = api.progress.createSnapshot.useMutation({
    onSuccess: () => {
      toast({
        title: 'Progress recorded!',
        description: 'Your measurements have been saved successfully.',
      });
      utils.progress.getProgressHistory.invalidate();
      setIsOpen(false);
      setFormData({
        weight: '',
        bodyFat: '',
        measurements: {
          chest: '',
          waist: '',
          hips: '',
          thighs: '',
          arms: '',
          neck: '',
        },
        notes: '',
      });
      setPhotoFile(null);
      setPhotoPreview(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Photo must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }

      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let photoUrl: string | undefined;

      // Upload photo if selected
      if (photoFile) {
        const uploadData = await uploadPhoto.mutateAsync({
          fileName: photoFile.name,
          fileType: photoFile.type,
          fileSize: photoFile.size,
        });

        const uploadResponse = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          body: photoFile,
          headers: {
            'Content-Type': photoFile.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload photo');
        }

        photoUrl = uploadData.publicUrl;
      }

      const measurements: any = {};
      Object.entries(formData.measurements).forEach(([key, value]) => {
        if (value) {
          measurements[key] = parseFloat(value);
        }
      });

      await createSnapshot.mutateAsync({
        date: new Date(),
        weight: parseFloat(formData.weight),
        bodyFatPercentage: formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
        measurements,
        photoUrl,
        notes: formData.notes || undefined,
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) {
    return (
      <Card className="card-interactive p-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex flex-col items-center gap-4 py-8 hover:scale-105 transition-transform"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">Record Progress</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track your measurements and see your improvement
            </p>
          </div>
        </button>
      </Card>
    );
  }

  return (
    <Card className="card-interactive p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">New Progress Snapshot</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Primary measurements */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight" className="flex items-center gap-2">
              <Weight className="w-4 h-4" />
              Weight (kg)
            </Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              required
              placeholder="75.5"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bodyFat">Body Fat %</Label>
            <Input
              id="bodyFat"
              type="number"
              step="0.1"
              value={formData.bodyFat}
              onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
              placeholder="15.5"
            />
          </div>
        </div>

        {/* Body measurements */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            <Label>Body Measurements (cm)</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(formData.measurements).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="capitalize text-sm">
                  {key}
                </Label>
                <Input
                  id={key}
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) => setFormData({
                    ...formData,
                    measurements: {
                      ...formData.measurements,
                      [key]: e.target.value,
                    },
                  })}
                  placeholder="0.0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Photo upload */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Progress Photo
          </Label>
          {photoPreview ? (
            <div className="relative">
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={photoPreview}
                  alt="Progress photo preview"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                onClick={removePhoto}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload a progress photo
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max size: 10MB
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="How are you feeling? Any changes to routine?"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={createSnapshot.isPending || isUploading || !formData.weight}
        >
          {(createSnapshot.isPending || isUploading) ? 'Saving...' : 'Save Progress'}
        </Button>
      </form>
    </Card>
  );
}