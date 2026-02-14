import json
from django.shortcuts import get_object_or_404
from django.shortcuts import render
from .models import Product, cartUser, orderItem, paymentMethod, shippingAddress
from .serializers import OrderItemSerializer, PaymentMethodSerializer, ProductSerializer, RegisterSerializer, UserSerializer, CartSerializer, CheckoutSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

# new imports
from django.views.decorators.csrf import csrf_exempt
from django.utils.timezone import now
import requests
import base64


# Create your views here.
@api_view(['GET'])
def product_list(request):
    product = Product.objects.all()
    serializer = ProductSerializer(product, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_product_data(request, pk):
    product = get_object_or_404(Product, pk=pk)
    serializer = ProductSerializer(product)
    return Response(serializer.data)

@api_view(['POST'])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message' : "User Registered Succesfully"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def logout_user(request):
    refresh_token = request.data.get('refresh')
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'User logged out successfully'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['GET'])
def profile_view(request):
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def view_cart(request):
    """Return cart items for the authenticated user."""
    items = cartUser.objects.filter(user=request.user).select_related('product')
    serializer = CartSerializer(items, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_cart(request):
    """Add a product to the authenticated user's cart or increase qty if exists.

    Expected payload: { "product_id": <int>, "qty": <int> }
    """
    product_id = request.data.get('product_id')
    qty = int(request.data.get('qty', 1))

    if not product_id:
        return Response({'detail': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    product = get_object_or_404(Product, pk=product_id)

    cart_item, created = cartUser.objects.get_or_create(user=request.user, product=product, defaults={'qty': qty})
    if not created:
        cart_item.qty = cart_item.qty + qty
        cart_item.save()

    serializer = CartSerializer(cart_item)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_cart(request, pk):
    """Update qty for a cart item (by cart id)."""
    cart_item = get_object_or_404(cartUser, pk=pk, user=request.user)
    qty = request.data.get('qty')
    if qty is None:
        return Response({'detail': 'qty is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cart_item.qty = int(qty)
    except ValueError:
        return Response({'detail': 'qty must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

    cart_item.save()
    serializer = CartSerializer(cart_item)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_cart(request, pk):
    """Delete a cart item for the authenticated user."""
    cart_item = get_object_or_404(cartUser, pk=pk, user=request.user)
    cart_item.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

# +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
# add ko lang to for practice purpose 


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_gcash_payment(request):

    serializer = CheckoutSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    user = request.user
    data = serializer.validated_data

    # 🔒 NEVER trust frontend total — compute from cart
    cart_items = cartUser.objects.filter(user=user)

    if not cart_items.exists():
        return Response({"error": "Cart is empty"}, status=400)

    total_price = sum(
        item.product.product_price * item.qty
        for item in cart_items
    )

    # PayMongo Secret (move to .env later)
    secret_key = "sk_test_6Wu2UUWNZkq1KqyjxjFNEzvZ"
    encoded_key = base64.b64encode(f"{secret_key}:".encode()).decode()

    headers = {
        "Authorization": f"Basic {encoded_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "data": {
            "attributes": {
                "amount": int(total_price * 100),
                "description": "Order Payment",
                "remarks": "GCash only",
                "redirect": {
                    "success": "http://localhost:5173/payment-success",
                    "failed": "http://localhost:3000/payment-failed"
                },
                "billing": {
                    "name": data["fullName"],
                    "email": user.email,
                },
                "payment_method_types": ["gcash"]
            }
        }
    }

    response = requests.post(
        "https://api.paymongo.com/v1/links",
        headers=headers,
        json=payload
    )

    result = response.json()

    if "data" not in result:
        return Response({"error": result}, status=400)

    checkout_url = result["data"]["attributes"]["checkout_url"]
    paymongo_id = result["data"]["id"]
    status_str = result["data"]["attributes"]["status"]

    # Create payment record
    payment = paymentMethod.objects.create(
        user=user,
        totalPrice=total_price,
        isPaid=False,
        paymongopayment=paymongo_id,
        paymongostatus=status_str
    )

    # Create shipping record
    shippingAddress.objects.create(
        paymentId=payment,
        fullName=data["fullName"],
        address=data["address"],
        city=data["city"],
        postalCode=data["postalCode"],
        country=data["country"]
    )

    return Response({"checkout_url": checkout_url}, status=200)


@csrf_exempt
@api_view(['POST'])
def paymongo_webhook(request):

    try:
        payload = json.loads(request.body)

        event_type = payload.get("data", {}).get("attributes", {}).get("type")

        if event_type == "link.payment.paid":

            paymongo_id = payload["data"]["attributes"]["data"]["id"]

            payment = paymentMethod.objects.filter(
                paymongopayment=paymongo_id
            ).first()

            if not payment:
                return Response({"message": "Payment not found"}, status=404)

            if payment.isPaid:
                return Response({"message": "Already processed"}, status=200)

            # Mark as paid
            payment.isPaid = True
            payment.paidAt = now()
            payment.paymongostatus = "paid"
            payment.save()

            # Create Order Items from cart
            cart_items = cartUser.objects.filter(user=payment.user)

            for item in cart_items:
                orderItem.objects.create(
                    product=item.product,
                    payment=payment,
                    qty=item.qty,
                    price=item.product.product_price
                )

            # Clear cart
            cart_items.delete()

            return Response(
                {"message": "Payment confirmed. Order items created."},
                status=200
            )

        return Response({"message": "Event received"}, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_user_orders(request):

    payments = (
        paymentMethod.objects
        .filter(user=request.user)
        .order_by('-id')
        .prefetch_related('orderitem_set__product', 'shippingaddress_set')
    )

    serializer = PaymentMethodSerializer(payments, many=True)
    return Response(serializer.data)

