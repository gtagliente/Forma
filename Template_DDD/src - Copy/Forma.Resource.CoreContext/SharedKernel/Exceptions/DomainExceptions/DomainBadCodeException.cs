using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Forma.CoreContext.SharedKernel.Exceptions.DomainExceptions;

public class DomainBadCodeException : BaseDomainException
{
    public DomainBadCodeException(string message) : base(message)
    {
    }
}
