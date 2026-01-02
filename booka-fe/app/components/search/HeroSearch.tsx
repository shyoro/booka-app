import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Slider } from '~/components/ui/slider';
import { MapPin, Users, Search, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useDebounce } from '~/hooks/useDebounce';

export interface SearchParams {
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  capacity?: number;
  minPrice?: number;
  maxPrice?: number;
}

interface HeroSearchProps {
  onSearch: (params: SearchParams) => void;
  initialParams?: SearchParams;
}

/**
 * Hero search component with location, date range, guests selector, and price range
 */
export function HeroSearch({ onSearch, initialParams }: HeroSearchProps) {
  const [location, setLocation] = useState(initialParams?.location || '');
  const [checkIn, setCheckIn] = useState<Date | undefined>(
    initialParams?.dateFrom ? new Date(initialParams.dateFrom) : undefined
  );
  const [checkOut, setCheckOut] = useState<Date | undefined>(
    initialParams?.dateTo ? new Date(initialParams.dateTo) : undefined
  );
  const [capacity, setCapacity] = useState<string>(initialParams?.capacity?.toString() || '');
  const [priceRange, setPriceRange] = useState<number[]>([
    initialParams?.minPrice || 0,
    initialParams?.maxPrice || 2000,
  ]);

  const debouncedLocation = useDebounce(location, 300);

  useEffect(() => {
    setLocation(initialParams?.location || '');
    setCheckIn(initialParams?.dateFrom ? new Date(initialParams.dateFrom) : undefined);
    setCheckOut(initialParams?.dateTo ? new Date(initialParams.dateTo) : undefined);
    setCapacity(initialParams?.capacity?.toString() || '');
    setPriceRange([
      initialParams?.minPrice || 0,
      initialParams?.maxPrice || 2000,
    ]);
  }, [initialParams]);

  const handleSearch = () => {
    onSearch({
      location: debouncedLocation || undefined,
      dateFrom: checkIn ? format(checkIn, 'yyyy-MM-dd') : undefined,
      dateTo: checkOut ? format(checkOut, 'yyyy-MM-dd') : undefined,
      capacity: capacity ? parseInt(capacity) : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 2000 ? priceRange[1] : undefined,
    });
  };

  return (
    <div
      className={cn(
        'p-6 lg:p-8',
        'bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl'
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-w-0">
          <div className="space-y-2 min-w-0" data-filter="location">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Where are you going?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2 min-w-0" data-filter="checkIn">
            <Label htmlFor="checkIn" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Check-in
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="checkIn"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !checkIn && 'text-muted-foreground'
                  )}
                >
                  {checkIn ? format(checkIn, 'MMM dd, yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={setCheckIn}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 min-w-0" data-filter="checkOut">
            <Label htmlFor="checkOut" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Check-out
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="checkOut"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !checkOut && 'text-muted-foreground'
                  )}
                >
                  {checkOut ? format(checkOut, 'MMM dd, yyyy') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={setCheckOut}
                  disabled={(date) => (checkIn ? date <= checkIn : date < new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 min-w-0" data-filter="guests">
            <Label htmlFor="guests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guests
            </Label>
            <Select value={capacity} onValueChange={setCapacity}>
              <SelectTrigger id="guests" className="w-full">
                <SelectValue placeholder="Guests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 guest</SelectItem>
                <SelectItem value="2">2 guests</SelectItem>
                <SelectItem value="3">3 guests</SelectItem>
                <SelectItem value="4">4 guests</SelectItem>
                <SelectItem value="5">5+ guests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 min-w-0" data-filter="priceRange">
            <Label htmlFor="priceRange" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="priceRange"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    priceRange[0] === 0 && priceRange[1] === 2000 && 'text-muted-foreground'
                  )}
                >
                  {priceRange[0] === 0 && priceRange[1] === 2000
                    ? 'Any price'
                    : `$${priceRange[0]} - $${priceRange[1]}`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={2000}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button
          onClick={handleSearch}
          className={cn(
            'w-full lg:w-auto lg:self-end',
            'flex items-center gap-2 shadow-2xl',
            'cursor-pointer transition-all',
            'hover:shadow-[inset_0_0_15px_rgba(59,130,246,0.2)]'
          )}
          size="lg"
        >
          <Search className="h-5 w-5" />
          Search
        </Button>
      </div>
    </div>
  );
}
