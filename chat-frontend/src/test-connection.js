import { NestJSApiEndpoint, NestJSAuthEndpoint } from "./endpoints/Endpoint";

// Esta função pode ser usada para testar a conexão
export async function testApiConnection() {
  try {
    console.log("Testando conexão com a API em:", NestJSApiEndpoint);

    // Testar com uma sequência de endpoints até encontrar um que responda
    const endpoints = ["/api", "/auth", "/users", "/"];

    for (const endpoint of endpoints) {
      try {
        console.log(`Tentando conectar em: ${NestJSApiEndpoint}${endpoint}`);
        const response = await fetch(`${NestJSApiEndpoint}${endpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status !== 404) {
          console.log(`Conexão bem-sucedida em ${endpoint}!`);
          return true;
        }
      } catch (err) {
        console.log(`Falha ao testar endpoint ${endpoint}:`, err.message);
        // Continue tentando outros endpoints
      }
    }

    console.error("Erro ao conectar com a API: Nenhum endpoint respondeu");
    return false;
  } catch (error) {
    console.error("Erro de conexão geral:", error);
    return false;
  }
}

// Esta função testa a autenticação
export async function testAuthentication(login, password) {
  try {
    console.log("Testando autenticação para usuário:", login);

    const response = await fetch(`${NestJSAuthEndpoint}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Autenticação bem-sucedida!", data);
      return { success: true, token: data.access_token };
    } else {
      console.error(
        "Erro de autenticação:",
        response.status,
        response.statusText,
        data
      );
      return {
        success: false,
        message: data.message || "Falha na autenticação",
      };
    }
  } catch (error) {
    console.error("Erro ao tentar autenticar:", error);
    return { success: false, message: "Erro de conexão" };
  }
}
