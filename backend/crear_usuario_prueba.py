"""
Script para crear un usuario de prueba en la base de datos
Ejecutar con: python crear_usuario_prueba.py
"""
import asyncio
import sys
sys.path.insert(0, '.')

from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def crear_usuario_prueba():
    """Crear un usuario de prueba"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["politicas_negocio_db"]
    usuarios_collection = db["usuarios"]
    
    try:
        # Definir el usuario de prueba
        usuario_prueba = {
            "username": "testuser",
            "nombre": "Usuario de Prueba",
            "contraseña_hash": pwd_context.hash("password123"),
            "rol": "funcionario",
            "departamento": "IT",
            "activo": True,
            "fecha_creacion": datetime.utcnow(),
            "ultimo_login": None
        }
        
        # Verificar si el usuario ya existe
        existe = await usuarios_collection.find_one({"username": "testuser"})
        if existe:
            print("❌ El usuario 'testuser' ya existe en la base de datos")
            # Actualizar la contraseña
            await usuarios_collection.update_one(
                {"username": "testuser"},
                {"$set": {"contraseña_hash": usuario_prueba["contraseña_hash"]}}
            )
            print("✅ Contraseña actualizada para 'testuser'")
        else:
            # Insertar el usuario
            resultado = await usuarios_collection.insert_one(usuario_prueba)
            print(f"✅ Usuario de prueba creado exitosamente")
            print(f"   ID: {resultado.inserted_id}")
        
        print("\n📋 Credenciales de prueba:")
        print(f"   Usuario: testuser")
        print(f"   Contraseña: password123")
        print(f"   Nombre: {usuario_prueba['nombre']}")
        print(f"   Rol: {usuario_prueba['rol']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(crear_usuario_prueba())
