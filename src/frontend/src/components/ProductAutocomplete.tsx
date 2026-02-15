import { useState, useRef } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Product } from '../backend';

interface ProductAutocompleteProps {
  products: Product[];
  value: string;
  onSelect: (productId: string, product: Product | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ProductAutocomplete({
  products,
  value,
  onSelect,
  placeholder = 'Search product...',
  disabled = false,
}: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isSelectingRef = useRef(false);

  // Only show selected product if value matches an actual product ID
  const selectedProduct = value ? products.find((p) => p.id.toString() === value) : null;

  // Filter products based on search query with defensive normalization
  const filteredProducts = products.filter((product) => {
    const query = (searchQuery || '').toLowerCase();
    const productName = (product.name || '').toLowerCase();
    const productCategory = (product.category || '').toLowerCase();
    return productName.includes(query) || productCategory.includes(query);
  });

  const handleSelect = (productId: string) => {
    // Guard against double-selection
    if (isSelectingRef.current) return;
    isSelectingRef.current = true;

    const product = products.find((p) => p.id.toString() === productId);
    onSelect(productId, product || null);

    // Close popover and reset search
    setOpen(false);
    setSearchQuery('');

    // Reset selection guard after a short delay
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent reopening during selection
    if (isSelectingRef.current && newOpen) return;
    setOpen(newOpen);

    // Reset search when closing
    if (!newOpen) {
      setSearchQuery('');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedProduct ? selectedProduct.name || 'Unnamed Product' : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {filteredProducts.map((product) => (
                <CommandItem
                  key={product.id.toString()}
                  value={product.id.toString()}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === product.id.toString() ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{product.name || 'Unnamed Product'}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.category || 'Uncategorized'} • ₹{(product.price || 0).toFixed(2)} • Stock: {Number(product.stockQuantity)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
