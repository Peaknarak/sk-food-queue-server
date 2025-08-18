import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Order } from '../App';
import { Clock, CheckCircle, XCircle, Store, Hash } from 'lucide-react';

interface OrderHistoryProps {
  orders: Order[];
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'waiting':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'waiting':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'rejected':
        return 'destructive';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'waiting':
        return 'Waiting for Confirmation';
      case 'confirmed':
        return 'Confirmed';
      case 'rejected':
        return 'Rejected';
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

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">Your order history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                <div className="flex items-center text-sm text-gray-600">
                  <Store className="h-4 w-4 mr-1" />
                  {order.vendorName}
                </div>
                <div className="text-sm text-gray-500">
                  {formatTime(order.createdAt)}
                </div>
              </div>
              
              <div className="text-right space-y-2">
                <Badge variant={getStatusColor(order.status)} className="flex items-center gap-1">
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status)}
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
            <div className="space-y-3">
              {/* Order Items */}
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <div className="flex-1">
                      <span className="text-sm">
                        {item.name} × {item.quantity}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      ₿{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total */}
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="font-bold text-lg">₿{order.totalAmount}</span>
              </div>
              
              {/* Status-specific messages */}
              {order.status === 'waiting' && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⏳ Your order is waiting for vendor confirmation. You'll receive a queue number once confirmed.
                  </p>
                </div>
              )}
              
              {order.status === 'confirmed' && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Order confirmed! Your queue number is <strong>#{order.queueNumber}</strong>. 
                    Please proceed to {order.vendorName} when your number is called.
                  </p>
                </div>
              )}
              
              {order.status === 'rejected' && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-800">
                    ❌ Sorry, your order was rejected by the vendor. This might be due to ingredient unavailability or high demand.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Reorder Items
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}