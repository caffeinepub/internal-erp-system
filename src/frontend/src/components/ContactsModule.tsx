import { useState } from 'react';
import {
  useGetAllContacts,
  useAddContact,
  useUpdateContact,
  useDeleteContact,
  useGetCallerUserRole,
  useGetAllEstimates,
} from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import type { Contact, Variant_purchaser_billTo, Variant_wholesaler_retailer } from '../backend';

export default function ContactsModule() {
  const { data: contacts = [], isLoading } = useGetAllContacts();
  const { data: estimates = [] } = useGetAllEstimates();
  const { data: userRole } = useGetCallerUserRole();
  const addContact = useAddContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const isAdmin = userRole === 'admin';

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
    contactType: 'billTo' as Variant_purchaser_billTo,
    contactCategory: 'wholesaler' as Variant_wholesaler_retailer,
  });

  const purchasers = contacts.filter((c) => c.contactType === 'purchaser');
  const billToContacts = contacts.filter((c) => c.contactType === 'billTo');

  // Calculate pending amount for each Bill To contact
  const calculatePendingAmount = (contactName: string) => {
    const contactEstimates = estimates.filter(
      (est) => est.customerName === contactName && !est.isPaid
    );
    return contactEstimates.reduce((sum, est) => sum + est.netAmount, 0);
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      contactInfo: '', 
      contactType: 'billTo' as Variant_purchaser_billTo,
      contactCategory: 'wholesaler' as Variant_wholesaler_retailer,
    });
  };

  const handleAdd = () => {
    if (formData.name && formData.contactInfo) {
      addContact.mutate(formData, {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleEdit = () => {
    if (selectedContact && formData.name && formData.contactInfo) {
      updateContact.mutate(
        {
          id: selectedContact.id,
          ...formData,
        },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedContact(null);
            resetForm();
          },
        }
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (!contactToDelete) return;

    deleteContact.mutate(contactToDelete.id, {
      onSuccess: () => {
        setContactToDelete(null);
      },
    });
  };

  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name,
      contactInfo: contact.contactInfo,
      contactType: contact.contactType,
      contactCategory: contact.contactCategory,
    });
    setIsEditDialogOpen(true);
  };

  const getContactTypeLabel = (contactType: Variant_purchaser_billTo) => {
    return contactType === 'purchaser' ? 'Purchaser' : 'Bill To';
  };

  const getContactCategoryLabel = (contactCategory: Variant_wholesaler_retailer) => {
    return contactCategory === 'wholesaler' ? 'Wholesaler' : 'Retailer';
  };

  const ContactTable = ({ contactList }: { contactList: Contact[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Pending Amount</TableHead>
            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {contactList.map((contact) => {
            const pendingAmount = contact.contactType === 'billTo' ? calculatePendingAmount(contact.name) : 0;
            return (
              <TableRow key={contact.id.toString()}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.contactInfo}</TableCell>
                <TableCell>
                  <Badge variant={contact.contactType === 'purchaser' ? 'secondary' : 'default'}>
                    {getContactTypeLabel(contact.contactType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getContactCategoryLabel(contact.contactCategory)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {contact.contactType === 'billTo' ? (
                    <span className={pendingAmount > 0 ? 'font-bold text-destructive' : 'text-muted-foreground'}>
                      ₹{pendingAmount.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(contact)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setContactToDelete(contact)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8" />
            Contact Management
          </h2>
          <p className="text-muted-foreground">Manage purchasers and bill-to contacts with pending amounts</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Contacts</CardTitle>
          <CardDescription>
            View and manage purchasers and bill-to contacts with automatic pending amount tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No contacts yet</p>
              {isAdmin && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Contact
                </Button>
              )}
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">All Contacts ({contacts.length})</TabsTrigger>
                <TabsTrigger value="purchasers">Purchasers ({purchasers.length})</TabsTrigger>
                <TabsTrigger value="billTo">Bill To ({billToContacts.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <ContactTable contactList={contacts} />
              </TabsContent>
              <TabsContent value="purchasers">
                {purchasers.length > 0 ? (
                  <ContactTable contactList={purchasers} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No purchasers yet
                  </div>
                )}
              </TabsContent>
              <TabsContent value="billTo">
                {billToContacts.length > 0 ? (
                  <ContactTable contactList={billToContacts} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No bill-to contacts yet
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Enter the details for the new contact
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-contact">Contact Information</Label>
              <Input
                id="add-contact"
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                placeholder="Email, phone, or address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-contact-type">Contact Type</Label>
              <Select
                value={formData.contactType}
                onValueChange={(value) =>
                  setFormData({ ...formData, contactType: value as Variant_purchaser_billTo })
                }
              >
                <SelectTrigger id="add-contact-type">
                  <SelectValue placeholder="Select contact type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchaser">Purchaser</SelectItem>
                  <SelectItem value="billTo">Bill To</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-contact-category">Category</Label>
              <Select
                value={formData.contactCategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, contactCategory: value as Variant_wholesaler_retailer })
                }
              >
                <SelectTrigger id="add-contact-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wholesaler">Wholesaler</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!formData.name || !formData.contactInfo || addContact.isPending}
            >
              {addContact.isPending ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update the contact details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact">Contact Information</Label>
              <Input
                id="edit-contact"
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                placeholder="Email, phone, or address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-type">Contact Type</Label>
              <Select
                value={formData.contactType}
                onValueChange={(value) =>
                  setFormData({ ...formData, contactType: value as Variant_purchaser_billTo })
                }
              >
                <SelectTrigger id="edit-contact-type">
                  <SelectValue placeholder="Select contact type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchaser">Purchaser</SelectItem>
                  <SelectItem value="billTo">Bill To</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact-category">Category</Label>
              <Select
                value={formData.contactCategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, contactCategory: value as Variant_wholesaler_retailer })
                }
              >
                <SelectTrigger id="edit-contact-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wholesaler">Wholesaler</SelectItem>
                  <SelectItem value="retailer">Retailer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedContact(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!formData.name || !formData.contactInfo || updateContact.isPending}
            >
              {updateContact.isPending ? 'Updating...' : 'Update Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!contactToDelete} onOpenChange={() => setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contact "{contactToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteContact.isPending}
            >
              {deleteContact.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
