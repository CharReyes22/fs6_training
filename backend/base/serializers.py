from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.models import User

from .models import (
    Product,
    cartUser,
    paymentMethod,
    orderItem,
    shippingAddress
)


# =========================
# USER SERIALIZERS
# =========================

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


# =========================
# PRODUCT SERIALIZER
# =========================

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


# =========================
# CART SERIALIZER
# =========================

class CartSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )

    class Meta:
        model = cartUser
        fields = ['id', 'product', 'product_id', 'qty', 'createdAt']
        read_only_fields = ['id', 'product', 'createdAt']


# =========================
# SHIPPING SERIALIZER
# =========================

class ShippingAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = shippingAddress
        fields = [
            'id',
            'fullName',
            'address',
            'city',
            'postalCode',
            'country'
        ]


# =========================
# ORDER ITEM SERIALIZER
# =========================

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = orderItem
        fields = [
            'id',
            'product',
            'qty',
            'price',
            'line_total'
        ]

    def get_line_total(self, obj):
        return obj.qty * obj.price


# =========================
# PAYMENT / ORDER SERIALIZER
# =========================

class PaymentMethodSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    shipping = serializers.SerializerMethodField()

    class Meta:
        model = paymentMethod
        fields = [
            'id',
            'totalPrice',
            'isPaid',
            'paidAt',
            'paymongopayment',
            'paymongostatus',
            'items',
            'shipping',
        ]

    def get_items(self, obj):
        qs = obj.orderitem_set.select_related('product').all()
        return OrderItemSerializer(qs, many=True).data

    def get_shipping(self, obj):
        addr = shippingAddress.objects.filter(paymentId=obj).first()
        if addr:
            return ShippingAddressSerializer(addr).data
        return None


# =========================
# CHECKOUT INPUT SERIALIZER
# =========================

class CheckoutSerializer(serializers.Serializer):
    fullName = serializers.CharField(max_length=255)
    address = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=255)
    postalCode = serializers.CharField(max_length=255)
    country = serializers.CharField(max_length=255)
