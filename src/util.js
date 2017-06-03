/* eslint no-loop-func: 0*/

import React from 'react';

export function browser(navigator) {
  let tem;
  const ua = navigator.userAgent;
  let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return `IE ${tem[1] || ''}`;
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem) return tem.slice(1).join(' ').replace('OPR', 'Opera');
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  tem = ua.match(/version\/(\d+)/i);
  if (tem) {
    M.splice(1, 1, tem[1]);
  }
  return M.join(' ');
}

// export function getOffset(el) {
//   const obj = el.getBoundingClientRect();
//   return {
//     left: obj.left + document.body.scrollLeft,
//     top: obj.top + document.body.scrollTop,
//     width: obj.width,
//     height: obj.height
//   };
// }

// // iscroll offset
// offset = function (el) {
//   var left = -el.offsetLeft,
//     top = -el.offsetTop;

//   // jshint -W084
//   while (el = el.offsetParent) {
//     left -= el.offsetLeft;
//     top -= el.offsetTop;
//   }
//   // jshint +W084

//   return {
//     left: left,
//     top: top
//   };
// }

/* eslint-disable */
export function getOffset(ele) {
  let doc, win, docElem, rect;

  if (!ele.getClientRects().length) {
    return { top: 0, left: 0 };
  }

  rect = ele.getBoundingClientRect();

  if (rect.width || rect.height) {
    doc = ele.ownerDocument;
    win = doc.defaultView;
    docElem = doc.documentElement;

    return {
      top: rect.top + win.pageYOffset - docElem.clientTop,
      left: rect.left + win.pageXOffset - docElem.clientLeft
    };
  }

  return rect;
}
/* eslint-enable */

function getChildrenlength(children) {
  let len = 1;
  if (Array.isArray(children)) {
    len = children.length;
  }
  return len;
}

function getSiblingPosition(index, len, siblingPosition) {
  if (len === 1) {
    siblingPosition.first = true;
    siblingPosition.last = true;
  } else {
    siblingPosition.first = index === 0;
    siblingPosition.last = index === len - 1;
  }
  return siblingPosition;
}

export function loopAllChildren(childs, callback, parent) {
  const loop = (children, level, levelArray, _parent, parentsChildrenPos, parentPos) => {
    const len = getChildrenlength(children);
    React.Children.forEach(children, (item, index) => {
      const pos = `${level}-${index}`;
      parentsChildrenPos.push(pos);
      const posArray = levelArray.slice();
      posArray.push(index);
      const childrenPos = [];
      if (item.props.children && item.type && item.type.isTreeNode) {
        loop(item.props.children, pos, posArray, { node: item, pos, posArray }, childrenPos, pos);
      }
      callback(item, index, pos, item.key || pos,
        getSiblingPosition(index, len, {}), _parent, posArray, childrenPos, parentPos);
    });
  };
  loop(childs, 0, [0], parent, []);
}

export function isInclude(smallArray, bigArray) {
  return smallArray.every((ii, i) => {
    return ii === bigArray[i];
  });
}
// console.log(isInclude(['0', '1'], ['0', '10', '1']));


// arr.length === 628, use time: ~20ms
export function filterParentPosition(arr) {
  const levelObj = {};
  arr.forEach((item) => {
    const posLen = item.split('-').length;
    if (!levelObj[posLen]) {
      levelObj[posLen] = [];
    }
    levelObj[posLen].push(item);
  });
  const levelArr = Object.keys(levelObj).sort((a, b) => Number(a) - Number(b));
  for (let i = 0; i < levelArr.length; i++) {
    if (levelArr[i + 1]) {
      levelObj[levelArr[i]].forEach(ii => {
        for (let j = i + 1; j < levelArr.length; j++) {
          levelObj[levelArr[j]].forEach((_i, index) => {
            if (isInclude(ii.split('-'), _i.split('-'))) {
              levelObj[levelArr[j]][index] = null;
            }
          });
          levelObj[levelArr[j]] = levelObj[levelArr[j]].filter(p => p);
        }
      });
    }
  }
  let nArr = [];
  levelArr.forEach(i => {
    nArr = nArr.concat(levelObj[i]);
  });
  return nArr;
}
// console.log(filterParentPosition(
//   ['0-2', '0-3-3', '0-10', '0-10-0', '0-0-1', '0-0', '0-1-1', '0-1']
// ));

export function handleCheckState(obj, checkedPositionArr, checkIt) {
  const childrenLoop = (parentObj) => {
    parentObj.childrenPos.forEach(childPos => {
      const childObj = obj[childPos];
      childObj.halfChecked = false;
      childObj.checked = checkIt;
      childrenLoop(childObj);
    });
  };

  checkedPositionArr.forEach(checkedPosition => {
    const checkedObj = obj[checkedPosition];
    childrenLoop(checkedObj);
  });

  const parentLoop = (childObj) => {
    if (!childObj.parentPos) return;
    const parentObj = obj[childObj.parentPos];

    const childrenCount = parentObj.childrenPos.length;

    let checkedChildrenCount = 0;
    parentObj.childrenPos.forEach(childPos => {
      if (obj[childPos].checked === true) checkedChildrenCount++;
      else if (obj[childPos].halfChecked === true) checkedChildrenCount += 0.5;
    });

    if (checkedChildrenCount === childrenCount) {
      parentObj.checked = true;
      parentObj.halfChecked = false;
    } else if (checkedChildrenCount > 0) {
      parentObj.halfChecked = true;
      parentObj.checked = false;
    } else {
      parentObj.checked = false;
      parentObj.halfChecked = false;
    }
    parentLoop(parentObj);
  };

  checkedPositionArr.forEach(checkedPosition => {
    const checkedObj = obj[checkedPosition];
    parentLoop(checkedObj);
  });
}

export function getCheck(treeNodesStates) {
  const halfCheckedKeys = [];
  const checkedKeys = [];
  const checkedNodes = [];
  const checkedNodesPositions = [];
  Object.keys(treeNodesStates).forEach((item) => {
    const itemObj = treeNodesStates[item];
    if (itemObj.checked) {
      checkedKeys.push(itemObj.key);
      checkedNodes.push(itemObj.node);
      checkedNodesPositions.push({ node: itemObj.node, pos: item });
    } else if (itemObj.halfChecked) {
      halfCheckedKeys.push(itemObj.key);
    }
  });
  return {
    halfCheckedKeys, checkedKeys, checkedNodes, checkedNodesPositions, treeNodesStates,
  };
}

export function getStrictlyValue(checkedKeys, halfChecked) {
  if (halfChecked) {
    return { checked: checkedKeys, halfChecked };
  }
  return checkedKeys;
}

export function arraysEqual(a, b) {
  if (a === b) return true;
  if (a === null || typeof a === 'undefined' || b === null || typeof b === 'undefined') {
    return false;
  }
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
