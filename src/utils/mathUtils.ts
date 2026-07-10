/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubcategoryDetails {
  name: string;
  tip: string;
  id: string;
}

export function getPuzzleSubcategory(q: string, levelIndex: number): SubcategoryDetails {
  if (levelIndex === 0) {
    if (q.includes('²')) {
      if (q.startsWith('(-')) {
        return {
          id: 'pot_sq_neg_paren',
          name: 'Cuadrados con Base Negativa entre Paréntesis',
          tip: '¡Recuerda que todo número negativo elevado al cuadrado (par) con paréntesis da POSITIVO! P. ej. (-3) × (-3) = +9.'
        };
      } else if (q.startsWith('-')) {
        return {
          id: 'pot_sq_neg_noparen',
          name: 'Cuadrados con Signo Negativo sin Paréntesis',
          tip: '¡Cuidado! Si no hay paréntesis, el signo menos (-) se queda afuera y no se eleva. P. ej. -3² = -(3 × 3) = -9.'
        };
      } else {
        return {
          id: 'pot_sq_pos',
          name: 'Cuadrados de Números Positivos',
          tip: 'Es muy sencillo, solo multiplica el número por sí mismo una vez. P. ej. 4² = 4 × 4 = 16.'
        };
      }
    } else if (q.includes('³')) {
      if (q.startsWith('(-')) {
        return {
          id: 'pot_cb_neg_paren',
          name: 'Cubos con Base Negativa entre Paréntesis',
          tip: 'Un número negativo elevado al cubo (impar) con paréntesis conserva su signo negativo. P. ej. (-2)³ = (-2) × (-2) × (-2) = -8.'
        };
      } else if (q.startsWith('-')) {
        return {
          id: 'pot_cb_neg_noparen',
          name: 'Cubos con Signo Negativo sin Paréntesis',
          tip: 'Al no tener paréntesis, el signo menos se queda afuera. Al ser impar, de todas formas el resultado es negativo. P. ej. -2³ = -8.'
        };
      } else {
        return {
          id: 'pot_cb_pos',
          name: 'Cubos de Números Positivos',
          tip: 'Multiplica el número por sí mismo tres veces. P. ej. 3³ = 3 × 3 × 3 = 27.'
        };
      }
    }
  }

  if (levelIndex === 1) {
    if (q.includes('/')) {
      return {
        id: 'val1_div',
        name: 'Evaluación con Divisiones o Fracciones',
        tip: 'Recuerda hacer primero la división (p. ej. y/2) antes de sumar o restar el resto de la expresión.'
      };
    } else if (q.includes('²') || q.includes('³')) {
      return {
        id: 'val1_power',
        name: 'Evaluación de Variables con Potencias',
        tip: 'Primero eleva el valor de la variable a la potencia indicada, y luego realiza las multiplicaciones, sumas o restas.'
      };
    } else if (q.includes('=-')) {
      return {
        id: 'val1_neg',
        name: 'Sustitución de Variables con Valores Negativos',
        tip: 'Al multiplicar un número por un valor negativo, recuerda la ley de signos: más por menos es menos, y menos por menos es más.'
      };
    } else {
      return {
        id: 'val1_simple',
        name: 'Evaluación Lineal Simple de 1 Variable',
        tip: 'Reemplaza la letra por el número. Recuerda que si el número está pegado a la letra, se están multiplicando.'
      };
    }
  }

  if (levelIndex === 2) {
    if (q.includes('²') || q.includes('³')) {
      return {
        id: 'val2_power',
        name: 'Sustitución con Exponentes (Dos Variables)',
        tip: 'Si una de las variables tiene exponente, haz esa operación primero. ¡Ojo con el signo si la base es negativa!'
      };
    } else if (q.includes('/') || q.includes('ab') || q.includes('xy')) {
      return {
        id: 'val2_mult_div',
        name: 'Multiplicación o División de Dos Variables',
        tip: 'Para "xy" o "ab", multiplica los dos valores sustituidos directamente. Aplica la ley de signos con cuidado.'
      };
    } else if (q.includes('=-') && (q.match(/=-/g) || []).length > 1) {
      return {
        id: 'val2_double_neg',
        name: 'Sustitución con Múltiples Valores Negativos',
        tip: 'Ambas variables son negativas. Pon paréntesis al reemplazarlas para no equivocarte con los signos continuos.'
      };
    } else {
      return {
        id: 'val2_simple',
        name: 'Evaluación Lineal con Dos Variables',
        tip: 'Sustituye ordenadamente cada letra en su lugar y opera respetando la jerarquía: primero multiplicaciones, luego sumas/restas.'
      };
    }
  }

  if (levelIndex === 3) {
    if (q.includes('²') || q.includes('³')) {
      return {
        id: 'red_power',
        name: 'Reducción de Términos con Exponentes',
        tip: 'Solo puedes agrupar x² con otros x² y x³ con otros x³. ¡No los mezcles con términos lineales como x!'
      };
    } else if (q.includes('xy') || q.includes('ab')) {
      return {
        id: 'red_compound',
        name: 'Reducción de Términos Compuestos (ab, xy)',
        tip: 'Los términos con letras unidas como "xy" solo se reducen con otros que tengan exactamente las mismas letras unidas.'
      };
    } else if (q.includes('y') && q.includes('x')) {
      return {
        id: 'red_two_vars',
        name: 'Agrupamiento de Clanes con Dos Letras (x, y)',
        tip: 'Suma o resta las x por un lado, y las y por otro lado. Al final quedan como clanes separados, ej: 3x + y.'
      };
    } else {
      return {
        id: 'red_simple',
        name: 'Reducción de una Sola Variable',
        tip: 'Agrupa todos los términos con la misma letra sumando o restando sus coeficientes numéricos.'
      };
    }
  }

  if (levelIndex === 4) {
    if (q.includes('[') || q.includes(']')) {
      return {
        id: 'grp_nested',
        name: 'Signos de Agrupación Anidados (Corchetes)',
        tip: 'Comienza eliminando los paréntesis () más internos, y luego elimina los corchetes [] externos.'
      };
    } else if (q.includes('-(') || q.includes('-[')) {
      return {
        id: 'grp_minus',
        name: 'Cambio de Signos por Signo Menos Exterior',
        tip: '¡REGLA DE ORO! Un signo menos justo antes de un paréntesis le cambia el signo a TODO lo que esté adentro.'
      };
    } else {
      return {
        id: 'grp_simple',
        name: 'Eliminación Simple de Paréntesis',
        tip: 'Si hay un signo más (+) antes del paréntesis, puedes quitarlo sin alterar los signos de adentro.'
      };
    }
  }

  return {
    id: 'general',
    name: 'Álgebra Básica General',
    tip: 'Opera con cuidado, paso a paso, prestando atención a la jerarquía de operadores y a la ley de signos.'
  };
}
