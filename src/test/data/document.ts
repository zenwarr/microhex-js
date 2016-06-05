import { expect } from 'chai';
import { Document } from '../../data/document';
import { AbstractDataSource, BufferDataSource } from '../../data/source';
import { check_read } from './_common';

describe('Document', function() {
  let doc:Document, source:AbstractDataSource;

  beforeEach(function() {
    source = new BufferDataSource(new Buffer('0123456789'));
    doc = new Document(source);
  });

  describe('ctor', function() {
    let doc:Document;

    beforeEach(function() {
      doc = new Document();
    });

    it('should initially have zero length', function() {
      expect(doc.length).to.be.equal(0);
    });

    it('should initially have null source', function() {
      expect(doc.source).to.be.null;
    });
  });

  describe('ctor with source initialization', function() {
    it('should have correct source', function() {
      expect(doc.source).to.be.equal(source);
    });

    it('should have correct length', function() {
      expect(doc.length).to.be.equal(source.length).equal(10);
    });
  });

  describe('reading', function() {
    it('should correctly read from source', function(done:MochaDone) {
      check_read(doc, 2, 4, new Buffer('2345'), done);
    });
  });
});
