using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Forma.CoreContext.SharedKernel.Exceptions;

public class BaseDomainException : Exception, IDomainExceptionMarker
{
    public BaseDomainException(string message) : base(message)
    {
    }
}
