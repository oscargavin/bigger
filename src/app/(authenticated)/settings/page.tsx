"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { api } from "@/utils/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReminderSettings } from "@/components/notifications/reminder-settings";
import {
  ArrowLeft,
  Camera,
  User,
  Activity,
  Globe,
  Save,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-client";

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user, isLoading: userLoading } = api.auth.getUser.useQuery();
  const utils = api.useUtils();

  const [hasChanges, setHasChanges] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    bio: "",
    avatarUrl: "",
    timezone: "",
    startingWeight: "",
    height: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.full_name || "",
        bio: user.bio || "",
        avatarUrl: user.avatar_url || "",
        timezone: user.timezone || "UTC",
        startingWeight: user.starting_weight || "",
        height: user.height || "",
      });
    }
  }, [user]);

  const updateProfileMutation = api.auth.updateUserProfile.useMutation({
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setHasChanges(false);
      utils.auth.getUser.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    const updates: any = {};

    // Always include all fields, even if empty (to allow clearing values)
    updates.fullName = profileData.fullName || "";
    updates.bio = profileData.bio || "";
    if (profileData.avatarUrl) updates.avatarUrl = profileData.avatarUrl;
    updates.timezone = profileData.timezone || "UTC";

    // Only include numeric fields if they have values
    if (profileData.startingWeight && profileData.startingWeight !== "") {
      updates.startingWeight = parseFloat(profileData.startingWeight);
    }
    if (profileData.height && profileData.height !== "") {
      updates.height = parseFloat(profileData.height);
    }

    updateProfileMutation.mutate(updates);
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("user-uploads")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-uploads").getPublicUrl(filePath);

      // Update local state
      setProfileData((prev) => ({ ...prev, avatarUrl: publicUrl }));
      setHasChanges(true);

      toast({
        title: "Avatar uploaded",
        description: "Your profile photo has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            className="gap-2"
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Profile Information</CardTitle>
                <CardDescription>Your public profile details</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-muted border-2 border-border overflow-hidden relative">
                {profileData.avatarUrl ? (
                  <Image
                    src={profileData.avatarUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">@{user?.username}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => {
                  setProfileData((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }));
                  setHasChanges(true);
                }}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => {
                  setProfileData((prev) => ({ ...prev, bio: e.target.value }));
                  setHasChanges(true);
                }}
                placeholder="Tell us about yourself..."
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {profileData.bio.length}/500
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={profileData.timezone}
                onValueChange={(value) => {
                  setProfileData((prev) => ({ ...prev, timezone: value }));
                  setHasChanges(true);
                }}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t border-border/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Member Since</span>
              <span className="font-medium">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Activity className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle className="text-xl">Physical Stats</CardTitle>
              <CardDescription>Your baseline measurements</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startingWeight">Starting Weight (lbs)</Label>
            <Input
              id="startingWeight"
              type="number"
              step="0.1"
              value={profileData.startingWeight}
              onChange={(e) => {
                setProfileData((prev) => ({
                  ...prev,
                  startingWeight: e.target.value,
                }));
                setHasChanges(true);
              }}
              placeholder="Enter weight"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Height (inches)</Label>
            <Input
              id="height"
              type="number"
              step="0.1"
              value={profileData.height}
              onChange={(e) => {
                setProfileData((prev) => ({ ...prev, height: e.target.value }));
                setHasChanges(true);
              }}
              placeholder="Enter height"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <ReminderSettings />
    </div>
  );
}
