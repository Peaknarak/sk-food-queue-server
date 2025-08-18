import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { CartItem } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Minus, Plus, Trash2, CreditCard, QrCode } from 'lucide-react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onPlaceOrder: (items: CartItem[], totalAmount: number) => void;
  isBookingActive: boolean;
}

export function Cart({ items, onUpdateQuantity, onPlaceOrder, isBookingActive }: CartProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Group items by vendor
  const itemsByVendor = items.reduce((groups, item) => {
    const vendorName = item.vendorName;
    if (!groups[vendorName]) {
      groups[vendorName] = [];
    }
    groups[vendorName].push(item);
    return groups;
  }, {} as Record<string, CartItem[]>);

  const handleCheckout = () => {
    setShowPayment(true);
  };

  const handlePayment = async () => {
    setPaymentProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setPaymentProcessing(false);
    setShowPayment(false);
    onPlaceOrder(items, totalAmount);
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🛒</div>
            <h3 className="text-lg text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600">Start browsing to add some delicious food!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Your Order
            <Badge variant="secondary">{totalItems} items</Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Items by Vendor */}
      {Object.entries(itemsByVendor).map(([vendorName, vendorItems]) => (
        <Card key={vendorName}>
          <CardHeader>
            <CardTitle className="text-lg">📍 {vendorName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendorItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-4 py-3 border-b last:border-b-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-600">₿{item.price} each</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={!isBookingActive}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                    className="w-16 text-center"
                    min="0"
                    disabled={!isBookingActive}
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={!isBookingActive}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-right min-w-[80px]">
                  <p className="font-medium">₿{item.price * item.quantity}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateQuantity(item.id, 0)}
                    className="text-red-500 hover:text-red-700 p-1"
                    disabled={!isBookingActive}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Order Total */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>Total Amount:</span>
              <span className="font-bold">₿{totalAmount}</span>
            </div>
            
            <Dialog open={showPayment} onOpenChange={setShowPayment}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                  disabled={!isBookingActive}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Payment
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Payment</DialogTitle>
                  <DialogDescription>
                    Complete your payment to place the order
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-6">
                  {!paymentProcessing ? (
                    <div className="text-center space-y-4">
                      <div className="text-lg">
                        Total Amount: <span className="font-bold">₿{totalAmount}</span>
                      </div>
                      
                      {/* Mock QR Code */}
                      <div className="flex justify-center">
                        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">QR Code Payment</p>
                            <p className="text-xs text-gray-500">Scan to pay ₿{totalAmount}</p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        Scan the QR code with your mobile banking app
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-lg">Processing payment...</p>
                      <p className="text-sm text-gray-600">Please wait while we confirm your payment</p>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  {!paymentProcessing ? (
                    <>
                      <Button variant="outline" onClick={() => setShowPayment(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handlePayment}>
                        Confirm Payment
                      </Button>
                    </>
                  ) : (
                    <Button disabled className="w-full">
                      Processing...
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {!isBookingActive && (
              <p className="text-sm text-amber-600 text-center">
                Orders can only be placed during booking hours (8:00 AM - 10:00 AM)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}