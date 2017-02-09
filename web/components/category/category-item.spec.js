import React from 'react';
import { mount, shallow } from 'enzyme';
import { expect } from 'chai';

import CategoryItem from './category-item';

describe('<CategoryItem/>', function () {
  it('should have an image to display the gravatar', function () {
    const wrapper = shallow(<CategoryItem/>);
    expect(wrapper.find('Link')).to.have.length(1);
  });
  //
  // it('should have props for email and src', function () {
  //   const wrapper = shallow(<Avatar/>);
  //   expect(wrapper.props().email).to.be.defined;
  //   expect(wrapper.props().src).to.be.defined;
  // });
});
