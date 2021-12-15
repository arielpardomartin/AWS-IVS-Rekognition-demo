import styled from 'styled-components';

const getAlignItems = (boxIsSmall) => {
  return boxIsSmall ? 'flex-start' : 'flex-end';
};

const getPadding = (boxIsSmall) => {
  return boxIsSmall ? '4px' : '4px 4px 8px 8px';
};

const getMarginTopOrBottom = (boxIsSmall) => {
  return boxIsSmall ? 'top' : 'bottom';
};

const Box = styled.div.attrs(props => ({
  style: {
    width: `${props.width * 100}%`,
    height: `${props.height * 100}%`,
    border: `solid 4px ${props.color}`,
    top: `${props.top * 100}%`,
    left: `${props.left * 100}%`
  }
}))`
    position: absolute;
    display: flex;
    justify-content: left;
    align-items: ${props => props.placeLabelOnTop ? getAlignItems(props.boxIsSmall) : 'flex-end'};

    span {
      ${props => `margin-${props.placeLabelOnTop ? getMarginTopOrBottom(props.boxIsSmall) : 'bottom'}: ${props.boxIsSmall ? '-27px' : '-4px'};`}
      padding: ${props => props.placeLabelOnTop ? getPadding(props.boxIsSmall) : '4px'};
      display: inline-block;
      background-color: ${props => `${props.color}`};
      color: white;
      font-size: 13px;
      margin-left: -4px;
      min-width: 75px;
    }
`;

export default Box;
