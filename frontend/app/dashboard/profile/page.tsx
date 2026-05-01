"use client"

import { useEffect, useState } from "react"
import {
  User,
  Mail,
  Building,
  Phone,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Clock,
  Edit,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-provider"

const activityData = [
  {
    id: 1,
    action: "Generated NDA document",
    time: "2 hours ago",
    icon: FileText,
  },
  {
    id: 2,
    action: "AI Chat: Contract law questions",
    time: "4 hours ago",
    icon: MessageSquare,
  },
  {
    id: 3,
    action: "Summarized: Client Agreement.pdf",
    time: "Yesterday",
    icon: FileText,
  },
  {
    id: 4,
    action: "Legal Search: Employment precedents",
    time: "Yesterday",
    icon: FileText,
  },
  {
    id: 5,
    action: "Generated Employment Contract",
    time: "2 days ago",
    icon: FileText,
  },
]

const stats = [
  { label: "Documents Generated", value: "47" },
  { label: "AI Queries", value: "234" },
  { label: "Templates Saved", value: "12" },
  { label: "Hours Saved", value: "89" },
]

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@lawfirm.com",
    phone: "+1 (555) 123-4567",
    company: "Sterling Law Partners",
    role: "Senior Attorney",
    location: "New York, NY",
    joinDate: "January 2024",
  })
  const [editProfile, setEditProfile] = useState(profile)

  useEffect(() => {
    if (!user) return
    const realProfile = {
      name: user.name || user.email,
      email: user.email,
      phone: "",
      company: "",
      role: "Legal Edge User",
      location: "",
      joinDate: new Date(user.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    }
    setProfile(realProfile)
    setEditProfile(realProfile)
  }, [user])

  const handleSaveProfile = () => {
    setProfile(editProfile)
    setIsEditDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight">
          Profile
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="border-border/50 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.picture || "/placeholder-avatar.jpg"} alt={profile.name} />
                  <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md transition-colors hover:bg-accent/90">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-semibold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.role}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.company}
              </p>

              <Separator className="my-6" />

              {/* Stats */}
              <div className="grid w-full grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details & Activity */}
        <div className="space-y-6 lg:col-span-2">
          {/* Account Details */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Details
                  </CardTitle>
                  <CardDescription>
                    Your personal information and contact details
                  </CardDescription>
                </div>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your personal information
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={editProfile.name}
                          onChange={(e) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editProfile.email}
                          onChange={(e) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editProfile.phone}
                          onChange={(e) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={editProfile.company}
                          onChange={(e) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              company: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          value={editProfile.role}
                          onChange={(e) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              role: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditProfile(profile)
                          setIsEditDialogOpen(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Building className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{profile.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{profile.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">{profile.joinDate}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your latest actions on the platform</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {activityData.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <activity.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
