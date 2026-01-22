


// Função para calcular a distância entre dois pontos (latitude, longitude) usando a fórmula de Haversine
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Raio da Terra em metros
    const dLat = (lat2 - lat1) * (Math.PI / 180); // Converter diferença de latitude para radianos
    const dLon = (lon2 - lon1) * (Math.PI / 180); // Converter diferença de longitude para radianos
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c; // Distância em metros
    return distancia;
  }
  
  // Função para verificar se a coordenada está dentro do raio especificado
  function verificarRaio(lat1, lon1, lat2, lon2, raio) {

    const distancia = calcularDistancia(lat1, lon1, lat2, lon2);
    return distancia <= raio; // Retorna true se a distância for menor ou igual ao raio
  }
  
  module.exports = {
    verificarRaio
}

