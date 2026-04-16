import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

async def test_departamentos():
    """Test CRUD de departamentos"""
    async with httpx.AsyncClient() as client:
        print("=" * 60)
        print("PRUEBA DE DEPARTAMENTOS CRUD")
        print("=" * 60)
        
        # 1. Crear departamentos
        print("\n1. CREAR DEPARTAMENTOS")
        print("-" * 60)
        
        departamentos_crear = [
            {
                "nombre": "Recursos Humanos",
                "codigo": "RH"
            },
            {
                "nombre": "Informática",
                "codigo": "IT"
            },
            {
                "nombre": "Finanzas",
                "codigo": "FIN"
            },
            {
                "nombre": "Operaciones",
                "codigo": "OPS"
            }
        ]
        
        departamento_ids = []
        
        for dept_data in departamentos_crear:
            response = await client.post(f"{BASE_URL}/departamentos", json=dept_data)
            if response.status_code == 201:
                dept = response.json()
                departamento_ids.append(dept["id"])
                print(f"✓ Departamento creado: {dept['nombre']} (ID: {dept['id']})")
            else:
                print(f"✗ Error al crear: {response.text}")
        
        # 2. Listar departamentos
        print("\n2. LISTAR DEPARTAMENTOS")
        print("-" * 60)
        
        response = await client.get(f"{BASE_URL}/departamentos")
        if response.status_code == 200:
            departamentos = response.json()
            print(f"Total de departamentos: {len(departamentos)}")
            for dept in departamentos:
                print(f"  - {dept['nombre']} ({dept['codigo']}) - {'✓ Activo' if dept['activo'] else '✗ Inactivo'}")
        else:
            print(f"✗ Error: {response.text}")
        
        # 3. Obtener un departamento específico
        print("\n3. OBTENER DEPARTAMENTO ESPECÍFICO")
        print("-" * 60)
        
        if departamento_ids:
            dept_id = departamento_ids[0]
            response = await client.get(f"{BASE_URL}/departamentos/{dept_id}")
            if response.status_code == 200:
                dept = response.json()
                print(f"Departamento: {dept['nombre']}")
                print(f"  - Código: {dept['codigo']}")
                print(f"  - Descripción: {dept['descripcion']}")
                print(f"  - Activo: {dept['activo']}")
            else:
                print(f"✗ Error: {response.text}")
        
        # 4. Actualizar un departamento
        print("\n4. ACTUALIZAR DEPARTAMENTO")
        print("-" * 60)
        
        if departamento_ids:
            dept_id = departamento_ids[0]
            update_data = {
                "nombre": "Recursos Humanos - Actualizado",
                "descripcion": "Descripción actualizada",
            }
            response = await client.put(f"{BASE_URL}/departamentos/{dept_id}", json=update_data)
            if response.status_code == 200:
                dept = response.json()
                print(f"✓ Departamento actualizado: {dept['nombre']}")
                print(f"  - Fecha de actualización: {dept['fecha_actualizacion']}")
            else:
                print(f"✗ Error: {response.text}")
        
        # 5. Eliminar un departamento (soft delete)
        print("\n5. ELIMINAR DEPARTAMENTO (Soft Delete)")
        print("-" * 60)
        
        if len(departamento_ids) > 1:
            dept_id = departamento_ids[1]
            response = await client.delete(f"{BASE_URL}/departamentos/{dept_id}")
            if response.status_code == 204:
                print(f"✓ Departamento eliminado (marcado como inactivo)")
            else:
                print(f"✗ Error: {response.text}")
        
        # 6. Listar solo departamentos activos
        print("\n6. LISTAR SOLO DEPARTAMENTOS ACTIVOS")
        print("-" * 60)
        
        response = await client.get(f"{BASE_URL}/departamentos?activos_solo=true")
        if response.status_code == 200:
            departamentos = response.json()
            print(f"Departamentos activos: {len(departamentos)}")
            for dept in departamentos:
                print(f"  - {dept['nombre']} ({dept['codigo']})")
        else:
            print(f"✗ Error: {response.text}")
        
        # 7. Restaurar un departamento
        print("\n7. RESTAURAR DEPARTAMENTO")
        print("-" * 60)
        
        if len(departamento_ids) > 1:
            dept_id = departamento_ids[1]
            response = await client.post(f"{BASE_URL}/departamentos/{dept_id}/restaurar")
            if response.status_code == 200:
                resultado = response.json()
                print(f"✓ {resultado['mensaje']}")
                print(f"  - Departamento: {resultado['nombre']}")
                print(f"  - Estado: {'Activo' if resultado['activo'] else 'Inactivo'}")
            else:
                print(f"✗ Error: {response.text}")
        
        print("\n" + "=" * 60)
        print("PRUEBA COMPLETADA")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_departamentos())
