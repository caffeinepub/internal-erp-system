import { useState, useMemo } from 'react';
import {
  useGetAllContacts,
  useAddContact,
  useUpdateContact,
  useDeleteContact,
  useGetAllEstimates,
  useIsCallerAdmin,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import type { Contact, Variant_purchaser_billTo, Variant_wholesaler_retailer } from '../backend';
import ModulePageHeader from './ModulePageHeader';

export default function ContactsModule() {
  const { data: contacts = [], isLoading } = useGetAllContacts();
  const { data: estimates = [] } = useGetAllEstimates();
  const { data: isAdmin } = useIsCallerAdmin();
  const addContact = useAddContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
    contactType: 'billTo' as Variant_purchaser_billTo,
    contactCategory: 'retailer' as Variant_wholesaler_retailer,
  });

  const billToContacts = useMemo(() => contacts.filter((c) => c.contactType === 'billTo'), [contacts]);
  const purchaserContacts = useMemo(() => contacts.filter((c) => c.contactType === 'purchaser'), [contacts]);

  const calculatePendingAmount = (contactName: string) => {
    return estimates
      .filter((est) => est.customerName === contactName && !est.isPaid)
      .reduce((sum, est) => sum + est.pendingAmount, 0);
  };

  const handleSubmit = () => {
    if (editingContact) {
      updateContact.mutate(
        {
          id: editingContact.id,
          ...formData,
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingContact(null);
            resetForm();
          },
        }
      );
    } else {
      addContact.mutate(formData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      contactInfo: contact.contactInfo,
      contactType: contact.contactType,
      contactCategory: contact.contactCategory,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (contactId: bigint) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      deleteContact.mutate(contactId);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactInfo: '',
      contactType: 'billTo' as Variant_purchaser_billTo,
      contactCategory: 'retailer' as Variant_wholesaler_retailer,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const renderContactTable = (contactList: Contact[], showPending: boolean) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact Info</TableHead>
            <TableHead>Category</TableHead>
            {showPending && <TableHead>Pending Amount</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contactList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showPending ? 5 : 4} className="text-center text-muted-foreground">
                No contacts found
              </TableCell>
            </TableRow>
          ) : (
            contactList.map((contact) => {
              const pendingAmount = showPending ? calculatePendingAmount(contact.name) : 0;
              return (
                <TableRow key={contact.id.toString()}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.contactInfo}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {contact.contactCategory === 'wholesaler' ? 'Wholesaler' : 'Retailer'}
                    </Badge>
                  </TableCell>
                  {showPending && (
                    <TableCell>
                      {pendingAmount > 0 ? (
                        <span className="text-destructive font-semibold">₹{pendingAmount.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">₹0.00</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(contact)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      <ModulePageHeader
        icon={<Users className="w-5 h-5" />}
        title="Contacts Management"
        subtitle="Manage customers and suppliers"
        actions={
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Contact
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Contacts</CardTitle>
          <CardDescription className="text-sm">View and manage your business contacts</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="billTo">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="billTo">Bill To ({billToContacts.length})</TabsTrigger>
              <TabsTrigger value="purchaser">Purchasers ({purchaserContacts.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="billTo" className="mt-4">
              {renderContactTable(billToContacts, true)}
            </TabsContent>
            <TabsContent value="purchaser" className="mt-4">
              {renderContactTable(purchaserContacts, false)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-2 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            <DialogDescription>
              {editingContact ? 'Update contact information' : 'Enter contact details'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contact Info</Label>
              <Input
                id="contactInfo"
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                placeholder="Phone or email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactType">Contact Type</Label>
              <Select
                value={formData.contactType}
                onValueChange={(value) =>
                  setFormData({ ...formData, contactType: value as Variant_purchaser_billTo })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billTo">Bill To</SelectItem>
                  <SelectItem value="purchaser">Purchaser</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactCategory">Category</Label>
              <Select
                value={formData.contactCategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, contactCategory: value as Variant_wholesaler_retailer })
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
                setIsDialogOpen(false);
                setEditingContact(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.name ||
                !formData.contactInfo ||
                addContact.isPending ||
                updateContact.isPending
              }
            >
              {addContact.isPending || updateContact.isPending
                ? 'Saving...'
                : editingContact
                  ? 'Update'
                  : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
