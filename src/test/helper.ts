before(function() {
  process.on('unhandledRejection', function(err:Error, p:Promise<any>) {
    console.warn('Unhandled rejection, ', err, p);
  });
});
