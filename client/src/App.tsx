
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Friend, FriendWithNotes, CreateFriendInput, UpdateFriendInput, CreateNoteInput, RecentActivity } from '../../server/src/schema';

function App() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [keepInTouchFriends, setKeepInTouchFriends] = useState<Friend[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<FriendWithNotes | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Form states
  const [friendForm, setFriendForm] = useState<CreateFriendInput>({
    name: '',
    emails: [],
    phones: [],
    birthday: null,
    keep_in_touch: true
  });

  const [editForm, setEditForm] = useState<UpdateFriendInput>({
    id: 0,
    name: '',
    emails: [],
    phones: [],
    birthday: null,
    keep_in_touch: true
  });

  const [noteForm, setNoteForm] = useState<CreateNoteInput>({
    friend_id: 0,
    text: ''
  });

  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [editEmailInput, setEditEmailInput] = useState('');
  const [editPhoneInput, setEditPhoneInput] = useState('');

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      const [friendsData, keepInTouchData, activitiesData] = await Promise.all([
        trpc.getFriends.query(),
        trpc.getKeepInTouchFriends.query(),
        trpc.getRecentActivities.query()
      ]);
      setFriends(friendsData);
      setKeepInTouchFriends(keepInTouchData);
      setRecentActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle friend selection for detail view
  const handleFriendSelect = async (friendId: number) => {
    try {
      const friendWithNotes = await trpc.getFriendById.query({ id: friendId });
      if (friendWithNotes) {
        setSelectedFriend(friendWithNotes);
        setIsDetailDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to load friend details:', error);
    }
  };

  // Handle adding new friend
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createFriend.mutate(friendForm);
      await loadAllData();
      setFriendForm({
        name: '',
        emails: [],
        phones: [],
        birthday: null,
        keep_in_touch: true
      });
      setEmailInput('');
      setPhoneInput('');
      setIsAddFriendDialogOpen(false);
    } catch (error) {
      console.error('Failed to create friend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editing friend
  const handleEditFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updateFriend.mutate(editForm);
      await loadAllData();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update friend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting friend
  const handleDeleteFriend = async (friendId: number) => {
    try {
      await trpc.deleteFriend.mutate({ id: friendId });
      await loadAllData();
      setIsDetailDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete friend:', error);
    }
  };

  // Handle adding note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createNote.mutate(noteForm);
      // Refresh friend details and all data
      if (selectedFriend) {
        const updatedFriend = await trpc.getFriendById.query({ id: selectedFriend.id });
        if (updatedFriend) {
          setSelectedFriend(updatedFriend);
        }
      }
      await loadAllData();
      setNoteForm({ friend_id: 0, text: '' });
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare edit form
  const prepareEditForm = (friend: Friend | FriendWithNotes) => {
    setEditForm({
      id: friend.id,
      name: friend.name,
      emails: friend.emails,
      phones: friend.phones,
      birthday: friend.birthday,
      keep_in_touch: friend.keep_in_touch
    });
    setEditEmailInput('');
    setEditPhoneInput('');
    setIsEditDialogOpen(true);
  };

  // Add email to form
  const addEmail = (isEdit = false) => {
    const email = isEdit ? editEmailInput : emailInput;
    if (email.trim()) {
      if (isEdit) {
        setEditForm(prev => ({
          ...prev,
          emails: [...(prev.emails || []), email.trim()]
        }));
        setEditEmailInput('');
      } else {
        setFriendForm(prev => ({
          ...prev,
          emails: [...(prev.emails || []), email.trim()]
        }));
        setEmailInput('');
      }
    }
  };

  // Add phone to form
  const addPhone = (isEdit = false) => {
    const phone = isEdit ? editPhoneInput : phoneInput;
    if (phone.trim()) {
      if (isEdit) {
        setEditForm(prev => ({
          ...prev,
          phones: [...(prev.phones || []), phone.trim()]
        }));
        setEditPhoneInput('');
      } else {
        setFriendForm(prev => ({
          ...prev,
          phones: [...(prev.phones || []), phone.trim()]
        }));
        setPhoneInput('');
      }
    }
  };

  // Remove email/phone
  const removeEmail = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        emails: prev.emails?.filter((_, i) => i !== index) || []
      }));
    } else {
      setFriendForm(prev => ({
        ...prev,
        emails: prev.emails?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const removePhone = (index: number, isEdit = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        phones: prev.phones?.filter((_, i) => i !== index) || []
      }));
    } else {
      setFriendForm(prev => ({
        ...prev,
        phones: prev.phones?.filter((_, i) => i !== index) || []
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4">
      {/* Spinning Heart Favicon Indicator */}
      <div className="heart-favicon-indicator"></div>
      
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black text-white mb-4 tracking-tight page-title-with-heart">
            FRIEND ZONE 🌟
          </h1>
          <p className="text-xl text-white/90 font-semibold">
            Your Super Vibrant Personal CRM! 💫
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/20 backdrop-blur-sm">
              <TabsTrigger 
                value="all" 
                className="text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-500 data-[state=active]:text-white"
              >
                🌈 All Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger 
                value="keepintouch"
                className="text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-blue-500 data-[state=active]:text-white"
              >
                💝 Keep in Touch ({keepInTouchFriends.length})
              </TabsTrigger>
              <TabsTrigger 
                value="activities"
                className="text-lg font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-400 data-[state=active]:to-pink-500 data-[state=active]:text-white"
              >
                ⚡ Recent Activities ({recentActivities.length})
              </TabsTrigger>
            </TabsList>

            {/* All Friends Tab */}
            <TabsContent value="all">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">All Your Amazing Friends! 🎉</h2>
                <Dialog open={isAddFriendDialogOpen} onOpenChange={setIsAddFriendDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold text-lg px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-all">
                      ✨ Add New Friend ✨
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-300 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-purple-800">🌟 Add Amazing New Friend! 🌟</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddFriend} className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="text-lg font-bold text-purple-700">Name 💫</Label>
                        <Input
                          id="name"
                          value={friendForm.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFriendForm(prev => ({ ...prev, name: e.target.value }))
                          }
                          className="border-2 border-purple-300 focus:border-purple-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label className="text-lg font-bold text-purple-700">Emails 📧</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            type="email"
                            value={emailInput}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailInput(e.target.value)}
                            placeholder="Add email..."
                            className="border-2 border-purple-300 focus:border-purple-500"
                          />
                          <Button type="button" onClick={() => addEmail()} className="bg-blue-500 hover:bg-blue-600">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {friendForm.emails?.map((email, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-200 text-blue-800">
                              {email}
                              <Button
                                type="button"
                                onClick={() => removeEmail(index)}
                                className="ml-2 h-4 w-4 p-0 bg-red-500 hover:bg-red-600 text-white"
                              >
                                ×
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-lg font-bold text-purple-700">Phones 📱</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            type="tel"
                            value={phoneInput}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneInput(e.target.value)}
                            placeholder="Add phone..."
                            className="border-2 border-purple-300 focus:border-purple-500"
                          />
                          <Button type="button" onClick={() => addPhone()} className="bg-green-500 hover:bg-green-600">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {friendForm.phones?.map((phone, index) => (
                            <Badge key={index} variant="secondary" className="bg-green-200 text-green-800">
                              {phone}
                              <Button
                                type="button"
                                onClick={() => removePhone(index)}
                                className="ml-2 h-4 w-4 p-0 bg-red-500 hover:bg-red-600 text-white"
                              >
                                ×
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="birthday" className="text-lg font-bold text-purple-700">Birthday 🎂</Label>
                        <Input
                          id="birthday"
                          type="date"
                          value={friendForm.birthday ? friendForm.birthday.toISOString().split('T')[0] : ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFriendForm(prev => ({ 
                              ...prev, 
                              birthday: e.target.value ? new Date(e.target.value) : null 
                            }))
                          }
                          className="border-2 border-purple-300 focus:border-purple-500"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="keep-in-touch"
                          checked={friendForm.keep_in_touch}
                          onCheckedChange={(checked: boolean) =>
                            setFriendForm(prev => ({ ...prev, keep_in_touch: checked }))
                          }
                        />
                        <Label htmlFor="keep-in-touch" className="text-lg font-bold text-purple-700">
                          Keep in Touch 💕
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg py-3 rounded-full"
                      >
                        {isLoading ? <span className="heart-spinner"></span> : '💖 Create Friend!'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-2xl text-white font-bold">No friends yet! Add your first amazing friend! 🌟</p>
                  </div>
                ) : (
                  friends.map((friend: Friend) => (
                    <Card 
                      key={friend.id} 
                      className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border-2 border-white/30 hover:border-white/50 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
                      onClick={() => handleFriendSelect(friend.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                          🎭 {friend.name}
                          {friend.keep_in_touch && (
                            <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
                              💝 Keep in Touch
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {friend.emails && friend.emails.length > 0 && (
                            <p className="text-white/90">
                              📧 {friend.emails.length} email{friend.emails.length > 1 ? 's' : ''}
                            </p>
                          )}
                          {friend.phones && friend.phones.length > 0 && (
                            <p className="text-white/90">
                              📱 {friend.phones.length} phone{friend.phones.length > 1 ? 's' : ''}
                            </p>
                          )}
                          {friend.birthday && (
                            <p className="text-white/90">
                              🎂 {friend.birthday.toLocaleDateString()}
                            </p>
                          )}
                          {friend.last_contacted && (
                            <p className="text-white/90">
                              💬 Last: {friend.last_contacted.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Keep in Touch Tab */}
            <TabsContent value="keepintouch">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Friends to Keep in Touch With! 💝</h2>
                <p className="text-white/80 text-lg">Ordered by who you should contact next 📅</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {keepInTouchFriends.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-2xl text-white font-bold">All caught up! No friends need extra attention right now! 🎉</p>
                  </div>
                ) : (
                  keepInTouchFriends.map((friend: Friend) => (
                    <Card 
                      key={friend.id} 
                      className="bg-gradient-to-br from-green-200/20 to-blue-200/20 backdrop-blur-sm border-2 border-green-300/50 hover:border-green-400/70 cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
                      onClick={() => handleFriendSelect(friend.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
                          💝 {friend.name}
                          <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
                            Priority
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {friend.last_contacted ? (
                            <p className="text-white/90 font-semibold">
                              💬 Last contacted: {friend.last_contacted.toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-yellow-200 font-bold">
                              ⚠️ Never contacted!
                            </p>
                          )}
                          {friend.emails && friend.emails.length > 0 && (
                            <p className="text-white/80">📧 {friend.emails[0]}</p>
                          )}
                          {friend.phones && friend.phones.length > 0 && (
                            <p className="text-white/80">📱 {friend.phones[0]}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Recent Activities Tab */}
            <TabsContent value="activities">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Recent Activities! ⚡</h2>
                <p className="text-white/80 text-lg">Latest interactions across all friends 📝</p>
              </div>

              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-2xl text-white font-bold">No activities yet! Start logging some interactions! 🚀</p>
                  </div>
                ) : (
                  recentActivities.map((activity: RecentActivity) => (
                    <Card 
                      key={activity.id} 
                      className="bg-gradient-to-r from-red-200/20 to-pink-200/20 backdrop-blur-sm border-2 border-red-300/50 hover:border-red-400/70 transform hover:scale-[1.02] transition-all duration-300"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-gradient-to-r from-red-400 to-pink-500 text-white">
                                🎯 {activity.friend_name}
                              </Badge>
                              <span className="text-white/80 text-sm">
                                {activity.timestamp.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-white font-medium">{activity.text}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Friend Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-blue-300 max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedFriend && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-blue-800 flex items-center justify-between">
                    🌟 {selectedFriend.name}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => prepareEditForm(selectedFriend)}
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                      >
                        ✏️ Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white">
                            🗑️ Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gradient-to-br from-red-100 to-pink-100">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-800">Delete Friend? 😢</AlertDialogTitle>
                            <AlertDialogDescription className="text-red-700">
                              Are you sure you want to delete {selectedFriend.name}? This will also delete all their notes and interactions. This action cannot be undone!
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteFriend(selectedFriend.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedFriend.emails && selectedFriend.emails.length > 0 && (
                      <div>
                        <h3 className="font-bold text-blue-700 mb-2">📧 Emails</h3>
                        <div className="space-y-1">
                          {selectedFriend.emails.map((email, index) => (
                            <p key={index} className="text-blue-600 bg-blue-50 p-2 rounded">{email}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedFriend.phones && selectedFriend.phones.length > 0 && (
                      <div>
                        <h3 className="font-bold text-blue-700 mb-2">📱 Phones</h3>
                        <div className="space-y-1">
                          {selectedFriend.phones.map((phone, index) => (
                            <p key={index} className="text-blue-600 bg-blue-50 p-2 rounded">{phone}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedFriend.birthday && (
                      <div>
                        <h3 className="font-bold text-blue-700 mb-2">🎂 Birthday</h3>
                        <p className="text-blue-600 bg-blue-50 p-2 rounded">
                          {selectedFriend.birthday.toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-blue-700 mb-2">💝 Keep in Touch</h3>
                      <Badge className={selectedFriend.keep_in_touch ? "bg-green-500" : "bg-gray-500"}>
                        {selectedFriend.keep_in_touch ? "Yes" : "No"}
                      </Badge>
                    </div>

                    {selectedFriend.last_contacted && (
                      <div>
                        <h3 className="font-bold text-blue-700 mb-2">💬 Last Contacted</h3>
                        <p className="text-blue-600 bg-blue-50 p-2 rounded">
                          {selectedFriend.last_contacted.toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add Note Section */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
                    <h3 className="font-bold text-green-700 mb-3">✨ Add New Note/Interaction ✨</h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      setNoteForm(prev => ({ ...prev, friend_id: selectedFriend.id }));
                      handleAddNote(e);
                    }} className="space-y-3">
                      <Textarea
                        value={noteForm.text}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setNoteForm(prev => ({ ...prev, text: e.target.value }))
                        }
                        placeholder="What happened? How was your interaction?"
                        className="border-2 border-green-300 focus:border-green-500 min-h-[100px]"
                        required
                      />
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold"
                      >
                        {isLoading ? <span className="heart-spinner"></span> : '💝 Add Note!'}
                      </Button>
                    </form>
                  </div>

                  {/* Notes History */}
                  <div>
                    <h3 className="font-bold text-blue-700 mb-3 text-xl">📝 Notes & Interactions ({selectedFriend.notes.length})</h3>
                    {selectedFriend.notes.length === 0 ? (
                      <p className="text-blue-600 bg-blue-50 p-4 rounded text-center">
                        No notes yet! Add your first interaction above! 🌟
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedFriend.notes.map((note) => (
                          <div key={note.id} className="bg-white/70 p-4 rounded-lg border-l-4 border-blue-400">
                            <div className="flex justify-between items-start mb-2">
                              <Badge className="bg-blue-500 text-white">
                                💬 {note.timestamp.toLocaleDateString()} at {note.timestamp.toLocaleTimeString()}
                              </Badge>
                            </div>
                            <p className="text-blue-800">{note.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Friend Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-300 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-yellow-800">✏️ Edit Friend Details ✏️</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditFriend} className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-lg font-bold text-yellow-700">Name 💫</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  className="border-2 border-yellow-300 focus:border-yellow-500"
                  required
                />
              </div>
              
              <div>
                <Label className="text-lg font-bold text-yellow-700">Emails 📧</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="email"
                    value={editEmailInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditEmailInput(e.target.value)}
                    placeholder="Add email..."
                    className="border-2 border-yellow-300 focus:border-yellow-500"
                  />
                  <Button type="button" onClick={() => addEmail(true)} className="bg-blue-500 hover:bg-blue-600">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.emails?.map((email, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-200 text-blue-800">
                      {email}
                      <Button
                        type="button"
                        onClick={() => removeEmail(index, true)}
                        className="ml-2 h-4 w-4 p-0 bg-red-500 hover:bg-red-600 text-white"
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-lg font-bold text-yellow-700">Phones 📱</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="tel"
                    value={editPhoneInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditPhoneInput(e.target.value)}
                    placeholder="Add phone..."
                    className="border-2 border-yellow-300 focus:border-yellow-500"
                  />
                  <Button type="button" onClick={() => addPhone(true)} className="bg-green-500 hover:bg-green-600">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editForm.phones?.map((phone, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-200 text-green-800">
                      {phone}
                      <Button
                        type="button"
                        onClick={() => removePhone(index, true)}
                        className="ml-2 h-4 w-4 p-0 bg-red-500 hover:bg-red-600 text-white"
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-birthday" className="text-lg font-bold text-yellow-700">Birthday 🎂</Label>
                <Input
                  id="edit-birthday"
                  type="date"
                  value={editForm.birthday ? editForm.birthday.toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm(prev => ({ 
                      ...prev, 
                      birthday: e.target.value ? new Date(e.target.value) : null 
                    }))
                  }
                  className="border-2 border-yellow-300 focus:border-yellow-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-keep-in-touch"
                  checked={editForm.keep_in_touch || false}
                  onCheckedChange={(checked: boolean) =>
                    setEditForm(prev => ({ ...prev, keep_in_touch: checked }))
                  }
                />
                <Label htmlFor="edit-keep-in-touch" className="text-lg font-bold text-yellow-700">
                  Keep in Touch 💕
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg py-3 rounded-full"
              >
                {isLoading ? <span className="heart-spinner"></span> : '💖 Update Friend!'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
