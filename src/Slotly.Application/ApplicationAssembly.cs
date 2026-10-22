using System.Reflection;

namespace Slotly.Application;

public static class ApplicationAssembly
{
    public static Assembly Reference => typeof(ApplicationAssembly).Assembly;
}
