import React, { Component } from 'react';
import './App.css';
import { HexGrid, Layout, Hexagon, Text, GridGenerator, HexUtils } from 'react-hexgrid';
import { log } from 'util';

class App extends Component {
  constructor(props) {
    super(props);
    const sizeL = 10;
    const sizeN = 10;
    const sizeM = 10;

    let pr = this.getSize([sizeL, sizeN, sizeM]);
    console.log(JSON.stringify(pr));
    let hexagons = GridGenerator.parallelogram(pr[0], pr[1], pr[2], pr[3]);
    const maxS = this.getSMax([sizeL, sizeN, sizeM]);
    let hexs = hexagons.reduce(function(filtered, hex) {
      let t = true;
      if (hex.s > maxS) t = false;
      if (hex.s < -(maxS)) t = false;
      if (t) {
        hex.status = 0;
        filtered.push(hex);
      }
      return filtered;
    }, []);

    const groups = [];

    this.handleInputChange = this.handleInputChange.bind(this);
    this.domainsGenerator = this.domainsGenerator.bind(this);

    this.state = { 
      hexs, 
      groups,
      groupsCount: 0,
      sizeValid: false,
      sizeL,
      sizeN,
      sizeM,
      rndSet: 50,
    };
  }
  
  getSize(sizeIn) {
    // Размер паралелограмма
    let size = [parseInt(sizeIn[0]),parseInt(sizeIn[1]),parseInt(sizeIn[2])]

    let y = size[1] + size[0] - 1;
    let x = size[2] + size[0] - 1;

    // Координаты параллелограмма q1 q2 r1 r2
    let q2 = (x-1)/2;
    let r2 = (y-1)/2;
    let q1 = -(q2);
    let r1 = -(r2);

    return [q1, q2, r1, r2];
  }

  getSMax(size) {
    // Вписываем в гексагон
    let pr = this.getSize(size);
    let qMax = pr[1] - size[2] + 1;
    let s = -qMax-pr[2];
    return s;
  }

  getGroupId() {
    let length = 12;
    let gid = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const max = chars.length - 1;

    for (let i = 0; i < length; ++i) {
      gid += chars[Math.floor(Math.random() * (max - 0 + 1))];
    }
    return gid;
  }

  getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  hexContains(hex, hexas) {
    // hex contains in hexas[]
    return hexas.some(function(hexC){
      if (HexUtils.equals(hexC, hex)) {
        return true;
      } else {
        return false;
      }
    });
  }

  hexReachable(start, end, aHexas) {
    // Достижимые hex
    let visited = {};
    // Массив массивов хексов
    let fringes = [[start]];
    // Перебор каждого массива в fringes
    for (let k = 0; fringes[k].length > 0; k++) {
        // Добавим еще пустой массив в конец fringes
        fringes[k+1] = [];
        // Перебор всех hex в перебираемом массиве
        for (let hex of fringes[k]) {
            // Для всех 6 соседей этого хекса
            for (let dir = 0; dir < 6; dir++) {
                // Получим каждого соседа
                let neighbor = HexUtils.neighbour(hex, dir);
                // Если соседа нет в visited и сосед есть в активных
                if (visited[HexUtils.getID(neighbor)] === undefined && aHexas[HexUtils.getID(neighbor)] !== undefined) {
                    visited[HexUtils.getID(neighbor)] = aHexas[HexUtils.getID(neighbor)];
                    fringes[k+1].push(neighbor);
                }
            }
        }
    }
    if (visited[HexUtils.getID(end)] !== undefined) {
      return true;
    } else {
      return false;
    }
  }

  changeHex(hexToChange) {
    const { hexs, groups, groupsCount } = this.state;

    // 0 - no, 1 - new group, 2 - to group, 3 - merge group, 4 - separation, 5 - del group
    let changeOther = 0;
    let groupToChange = {};
    let neighbours = [];
    let changedGroups = groups;
    let gCount = groupsCount;
    let colors = ['green', 'blue', 'magenta', 'black', 'orange', 'brown', 'indigo', 'gray', 'coral'];

    const hexas = hexs.map(hex => {
      if (HexUtils.equals(hexToChange, hex)) {
        // Есть соседи со статусом 1?
        let neighboursCoord = HexUtils.neighbours(hex);
        neighbours = hexs.filter(function(hex) {
          return neighboursCoord.some(function(hexC){
            if (HexUtils.equals(hexC, hex)) {
              if (hex.status === 1) {
                return true;
              } else {
                return false;
              }
            } else {
              return false;
            }
          });
        });
        // Меняем статус при клике
        if (hex.status === 0) {
          hex.status = 1;
          if (neighbours[0]) {
            // Какие группы есть у соседей
            let grn = neighbours.reduce(function(filtered, hex3) {
              if (hex3.group) {
                if (filtered.findIndex(item => item.group === hex3.group) === -1) {
                  let gr = {
                    group: hex3.group,
                    color: hex3.color
                  }
                  filtered.push(gr);
                }
              }
              return filtered;
            }, []);

            if (grn[0]) {
              // Есть соседи в группе
              if (grn.length >= 2) {
                // Больше 2 групп
                changeOther = 3;
                hex.group = grn[0].group;
                hex.color = grn[0].color;
                groupToChange = {
                  group: grn[0].group,
                  color: grn[0].color
                };
              } else {
                // Одна группа
                changeOther = 2;
                hex.group = grn[0].group;
                hex.color = grn[0].color;
                groupToChange = {
                  group: grn[0].group,
                  color: grn[0].color
                };
              }
            } else {
              // Соседи есть, но они не в группе создадим группу и цвет
              changeOther = 1;
              groupToChange = {
                group: this.getGroupId(),
                color: colors[this.getRandomInt(9)]
              };
              hex.group = groupToChange.group;
              hex.color = groupToChange.color;
              changedGroups.push(groupToChange.group);
              gCount = changedGroups.length;
            }
          } else {
            // Соседей нет, берем цвет одиночки red
            changeOther = 0;
            hex.color = "red";
          }
        } else {
          // Выключили статус
          hex.status = 0;
          groupToChange.group = hex.group;
          if (hex.color) {
            groupToChange.color = hex.color;
            hex.color = null;
          }
          // Проверка соседей и групп
          if (hex.group) {
            groupToChange.group = hex.group;
            hex.group = null;

            // Объект, активных объектов hex
            let aHexas = hexs.reduce(function(filtered, hex) {
              if (hex.status === 1) {
                let id = HexUtils.getID(hex);
                filtered[id] = hex;
                /* filtered.push({
                  [id]: hex
                }); */
              }
              return filtered;
            }, {});

            if (neighbours.length === 1) {
              // Сосед один, удаляем группу
              changeOther = 5;
            } else {
              // Достижимость
              let self = this;
              neighbours.forEach(function(hex1) {
                neighbours.forEach(function(hex2) {
                  if (hex1 !== hex2) {
                    // Если все true то хорошо, если нет то всех удаляем
                    if (!self.hexReachable(hex1, hex2, aHexas)) {
                      changeOther = 5;
                    }
                  }
                })
              })
            }
          } else {
            changeOther = 0;
          }
        }
      }
      return hex;
    });
    //console.log(changeOther);
    
    switch(changeOther) {
      case 1:
        neighbours.forEach(function(hex) {
          hex.group = groupToChange.group;
          hex.color = groupToChange.color;
        });
        break;
      case 3:
        // Слияние групп, все группы не входящие в мою меняются на мою
        //console.log(JSON.stringify(neighbours));
        let grn = neighbours.reduce(function(filtered, hex3) {
          if (hex3.group) {
            if (filtered.findIndex(item => item.group === hex3.group) === -1) {
              let gr = {
                group: hex3.group,
                color: hex3.color
              }
              filtered.push(gr);
            }
          }
          return filtered;
        }, []);
        grn.forEach(function(gr) {
          changedGroups = groups.filter(function(gr2) {
            if (gr2 !== gr.group) return true;
            return false;
          })
          gCount = changedGroups.length;
          hexas.forEach(function(hex) {
            if (hex.group === gr.group) {
              hex.group = groupToChange.group;
              hex.color = groupToChange.color;
            }
          })
        });
        break;
      case 4:
      case 5:
          hexas.forEach(function(hex) {
            if (hex.group === groupToChange.group) {
              hex.group = null;
              hex.color = null;
              hex.status = 0;
            }
            changedGroups = groups.filter(function(gr) {
              if (gr !== groupToChange.group) return true;
              return false;
            })
            gCount = changedGroups.length;
          })
        break;
      default:
        // Менять других не будем
    }
    this.setState({ hexs: hexas, groups: changedGroups, groupsCount: gCount });
  }

  onClick(event, source) {
    this.changeHex(source.state.hex);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    let rnd = false;
    let { sizeL, sizeN, sizeM, rndSet } = this.state;

    switch(name) {
      case "sizeL":
        sizeL = parseInt(value);
        break;
      case "sizeN":
        sizeN = parseInt(value);
        break;
      case "sizeM":
        sizeM = parseInt(value);
        break;
      case "rndSet":
        rnd = true;
        break;
      default:
    }

    if (rnd) {
      this.setState({
        rndSet: parseInt(value)
      });
    } else {
      if (sizeL > 30) sizeL = 30;
      if (sizeN > 30) sizeN = 30;
      if (sizeM > 30) sizeM = 30;

      let pr = this.getSize([sizeL, sizeN, sizeM]);
      let hexagons = GridGenerator.parallelogram(pr[0], pr[1], pr[2], pr[3]);
      const maxS = this.getSMax([sizeL, sizeN, sizeM]);
      let hexs = hexagons.reduce(function(filtered, hex) {
        let t = true;
        if (hex.s > maxS) t = false;
        if (hex.s < -(maxS)) t = false;
        if (t) {
        hex.status = 0;
        filtered.push(hex);
      }
      return filtered;
    }, []);
      this.setState({
        groups: [],
        groupsCount: 0,
        hexs,
        [name]: value
      });
    }
  }

  domainsGenerator() {
    const { rndSet, sizeL, sizeN, sizeM } = this.state;
    let set = parseInt(rndSet/10);
    let self = this;

    let pr = this.getSize([sizeL, sizeN, sizeM]);
      let hexagons = GridGenerator.parallelogram(pr[0], pr[1], pr[2], pr[3]);
      const maxS = this.getSMax([sizeL, sizeN, sizeM]);
      let hexas = hexagons.reduce(function(filtered, hex) {
        let t = true;
        if (hex.s > maxS) t = false;
        if (hex.s < -(maxS)) t = false;
        if (t) {
        hex.status = 0;
        filtered.push(hex);
      }
      return filtered;
    }, []);
    self.setState({
      groups: [],
      groupsCount: 0,
      hexs: hexas
    });

    hexas.forEach(function(hex) {
      let rnd = [];
      let sum = 0;
      for (let i = 0; i < 10; i++) { 
        rnd.push((Math.floor(Math.random() * Math.floor(2))));
      };
      rnd.forEach(function(item) {
        sum = sum + item;
      });
      if (sum < set) self.changeHex(hex);
    });
  }

  // Render
  render() {
    const { hexs, groupsCount } = this.state;
    const hexagonSize = { x: 1, y: 1 };
    //console.log(JSON.stringify(hexs[0]));
    
    return (
      <div className="App">
        <header className="App-header">
          <h2>{"Domains: " + groupsCount}</h2>
          <form className="gridForm">
            <div className="form-group">
              <input type="number" className="form-control" name="sizeL" value={this.state.sizeL} onChange={this.handleInputChange} min="1" max="30" />
              <input type="number" className="form-control" name="sizeN" value={this.state.sizeN} onChange={this.handleInputChange} min="1" max="30" />
              <input type="number" className="form-control" name="sizeM" value={this.state.sizeM} onChange={this.handleInputChange} min="1" max="30" />
            </div>
          </form>
          <div className="btn-group">
            <input type="number" className="btn-control" name="rndSet" value={this.state.rndSet} onChange={this.handleInputChange} min="1" max="99" />
            <button onClick={this.domainsGenerator} disabled="true">AUTO</button>
          </div>
          <HexGrid width={1200} height={1000}>
            <Layout size={hexagonSize} flat={false} origin={{ x: 0, y: 0 }}>
            {
            hexs.map((hex, i) => (
                  <Hexagon 
                    key={"hex" + i} 
                    q={hex.q} 
                    r={hex.r} 
                    s={hex.s} 
                    data={hex}
                    className={hex.color ? hex.color : null}  
                    onClick={(e, h) => this.onClick(e, h)}
                  >
                    <Text>{hex.status ? hex.status + "" : null}</Text>
                  </Hexagon>
                ))
            }
            </Layout>
          </HexGrid>
        </header>
      </div>
    );
  }
}

export default App;
