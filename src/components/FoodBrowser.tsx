import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { FoodItem } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Search, Plus, Store } from 'lucide-react';
import { unsplash_tool } from '../tools/unsplash';

interface FoodBrowserProps {
  onAddToCart: (foodItem: FoodItem) => void;
  isBookingActive: boolean;
}

export function FoodBrowser({ onAddToCart, isBookingActive }: FoodBrowserProps) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [loading, setLoading] = useState(true);

  const vendors = [
    { id: 'V001', name: 'Thai Kitchen' },
    { id: 'V002', name: 'Western Grill' },
    { id: 'V003', name: 'Noodle Station' },
    { id: 'V004', name: 'Fresh Salads' }
  ];

  // Mock food data - in real app this would come from API
  useEffect(() => {
    const loadFoodItems = async () => {
      setLoading(true);
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockItems: FoodItem[] = [
        {
          id: '1',
          name: 'Pad Thai',
          price: 45,
          image: 'https://images.unsplash.com/photo-1559314809-0f31657b3c4e?w=300&h=200&fit=crop',
          vendorId: 'V001',
          vendorName: 'Thai Kitchen',
          available: true
        },
        {
          id: '2',
          name: 'Thai Tea',
          price: 25,
          image: 'https://images.unsplash.com/photo-1571934811739-37d5e69bd3e3?w=300&h=200&fit=crop',
          vendorId: 'V001',
          vendorName: 'Thai Kitchen',
          available: true
        },
        {
          id: '3',
          name: 'Green Curry',
          price: 55,
          image: 'https://images.unsplash.com/photo-1455619452474-4fd5e28b7c66?w=300&h=200&fit=crop',
          vendorId: 'V001',
          vendorName: 'Thai Kitchen',
          available: true
        },
        {
          id: '4',
          name: 'Mango Sticky Rice',
          price: 40,
          image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=300&h=200&fit=crop',
          vendorId: 'V001',
          vendorName: 'Thai Kitchen',
          available: false
        },
        {
          id: '5',
          name: 'Burger Combo',
          price: 120,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop',
          vendorId: 'V002',
          vendorName: 'Western Grill',
          available: true
        },
        {
          id: '6',
          name: 'Grilled Chicken',
          price: 95,
          image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300&h=200&fit=crop',
          vendorId: 'V002',
          vendorName: 'Western Grill',
          available: true
        },
        {
          id: '7',
          name: 'Fish & Chips',
          price: 110,
          image: 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=300&h=200&fit=crop',
          vendorId: 'V002',
          vendorName: 'Western Grill',
          available: true
        },
        {
          id: '8',
          name: 'Tom Yum Noodles',
          price: 50,
          image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop',
          vendorId: 'V003',
          vendorName: 'Noodle Station',
          available: true
        },
        {
          id: '9',
          name: 'Beef Noodle Soup',
          price: 60,
          image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop',
          vendorId: 'V003',
          vendorName: 'Noodle Station',
          available: true
        },
        {
          id: '10',
          name: 'Caesar Salad',
          price: 65,
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop',
          vendorId: 'V004',
          vendorName: 'Fresh Salads',
          available: true
        },
        {
          id: '11',
          name: 'Greek Salad',
          price: 70,
          image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=200&fit=crop',
          vendorId: 'V004',
          vendorName: 'Fresh Salads',
          available: true
        }
      ];
      
      setFoodItems(mockItems);
      setLoading(false);
    };

    loadFoodItems();
  }, []);

  const filteredItems = foodItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = selectedVendor === 'all' || item.vendorId === selectedVendor;
    return matchesSearch && matchesVendor;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search food items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select 
          value={selectedVendor} 
          onChange={(e) => setSelectedVendor(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md bg-white"
        >
          <option value="all">All Vendors</option>
          {vendors.map(vendor => (
            <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
          ))}
        </select>
      </div>

      {/* Food Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className={`transition-all duration-200 hover:shadow-lg ${!item.available ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <Store className="h-3 w-3 mr-1" />
                    {item.vendorName}
                  </CardDescription>
                </div>
                {!item.available && (
                  <Badge variant="destructive" className="text-xs">
                    Unavailable
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-xl">₿{item.price}</div>
                <Button
                  onClick={() => onAddToCart(item)}
                  disabled={!isBookingActive || !item.available}
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg text-gray-900 mb-2">No food items found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}