import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Order } from '../App';
import { Clock, CheckCircle, XCircle, User, Hash, Calendar } from 'lucide-react';

interface VendorOrdersProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: 'confirmed' | 'rejected', queueNumber?: number) => void;
}

export function VendorOrders({ orders, onUpdateOrderStatus }: VendorOrdersProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [queueNumber, setQueueNumber] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const pendingOrders = orders.filter(order => order.status === 'waiting');
  const confirmedOrders = orders.filter(order => order.status === 'confirmed');
  const rejectedOrders = orders.filter(order => order.status === 'rejected');

  const handleConfirmOrder = (order: Order) => {
    setSelectedOrder(order);
    setQueueNumber('');
    setShowConfirmDialog(true);
  };

  const handleRejectOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowRejectDialog(true);
  };

  const confirmOrder = () => {
    if (selectedOrder && queueNumber) {
      onUpdateOrderStatus(selectedOrder.id, 'confirmed', parseInt(queueNumber));
      setShowConfirmDialog(false);
      setSelectedOrder(null);
      setQueueNumber('');
    }
  };

  const rejectOrder = () => {
    if (selectedOrder) {
      onUpdateOrderStatus(selectedOrder.id, 'rejected');
      setShowRejectDialog(false);
      setSelectedOrder(null);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const OrderCard = ({ order, showActions = false }: { order: Order; showActions?: boolean }) => (
    <Card key={order.id} className="transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              {order.studentName}
            </CardTitle>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              {formatTime(order.createdAt)}
            </div>
            <div className="text-sm text-gray-500">
              Order ID: #{order.id}
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <Badge variant={
              order.status === 'waiting' ? 'secondary' :
              order.status === 'confirmed' ? 'default' :
              'destructive'
            }>
              {order.status === 'waiting' && <Clock className="h-3 w-3 mr-1" />}
              {order.status === 'confirmed' && <CheckCircle className="h-3 w-3 mr-1" />}
              {order.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
              {order.status === 'waiting' ? 'Pending' :
               order.status === 'confirmed' ? 'Confirmed' :
               'Rejected'}
            </Badge>
            
            {order.status === 'confirmed' && order.queueNumber && (
              <div className="flex items-center text-sm text-blue-600">
                <Hash className="h-4 w-4 mr-1" />
                Queue #{order.queueNumber}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Order Items */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Order Items:</h4>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-1 text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span className="text-gray-600">₿{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          {/* Total */}
          <div className="border-t pt-2 flex justify-between items-center">
            <span className="font-medium">Total Amount</span>
            <span className="font-bold text-lg">₿{order.totalAmount}</span>
          </div>
          
          {/* Action Buttons */}
          {showActions && order.status === 'waiting' && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleConfirmOrder(order)}
                className="flex-1"
                variant="default"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept Order
              </Button>
              <Button
                onClick={() => handleRejectOrder(order)}
                className="flex-1"
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject Order
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Pending Orders */}
      <div>
        <h2 className="text-xl mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          Pending Orders ({pendingOrders.length})
        </h2>
        
        {pendingOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg text-gray-900 mb-2">No pending orders</h3>
                <p className="text-gray-600">New orders will appear here for your review</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} showActions={true} />
            ))}
          </div>
        )}
      </div>

      {/* Confirmed Orders */}
      {confirmedOrders.length > 0 && (
        <div>
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Confirmed Orders ({confirmedOrders.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {confirmedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Orders */}
      {rejectedOrders.length > 0 && (
        <div>
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Rejected Orders ({rejectedOrders.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rejectedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}

      {/* Confirm Order Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>
              Accept this order and assign a queue number
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Order Summary</h4>
                <p className="text-sm text-gray-600 mb-2">Student: {selectedOrder.studentName}</p>
                <div className="space-y-1">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₿{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>₿{selectedOrder.totalAmount}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="queueNumber">Queue Number</Label>
                <Input
                  id="queueNumber"
                  type="number"
                  placeholder="Enter queue number"
                  value={queueNumber}
                  onChange={(e) => setQueueNumber(e.target.value)}
                  min="1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmOrder} disabled={!queueNumber}>
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Order Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this order?
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Order from {selectedOrder.studentName}</h4>
              <p className="text-sm text-gray-600">Total: ₿{selectedOrder.totalAmount}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={rejectOrder}>
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}