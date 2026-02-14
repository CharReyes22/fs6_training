from django.urls import path
from .views import (
    product_list,
    get_product_data,
    register_user,
    logout_user,
    profile_view,
    add_cart,
    update_cart,
    delete_cart,
    view_cart,
    create_gcash_payment,
    paymongo_webhook,
    list_user_orders,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('products/', product_list, name="product_list"),
    path('products/<int:pk>/', get_product_data, name="product_data"),

    path('register/', register_user, name='register'),
    # login function
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', logout_user, name='logout'),
    path('profile/', profile_view, name='profile'),

    path('cart/add/', add_cart, name='add_cart'),
    path('cart/update/<int:pk>/', update_cart, name='update_cart'),
    path('cart/delete/<int:pk>/', delete_cart, name='delete_cart'),
    path('cart/', view_cart, name='view_cart'),

    # Payment
    path('checkout/gcash/', create_gcash_payment, name='create_gcash_payment'),
    path('webhook/paymongo/', paymongo_webhook, name='paymongo_webhook'),

    # Orders
    path('orders/', list_user_orders, name='orders'),


]
